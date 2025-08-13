// /api/create-payment.js

// Importa as ferramentas necessárias do Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';

// A função principal que a Vercel executa quando esta API é chamada
export default async function handler(req, res) {

    // --- INÍCIO DO CÓDIGO DE DEPURAÇÃO ---
    // Este bloco verifica se a variável de ambiente está acessível.
    console.log("Iniciando a função /api/create-payment...");
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
        // Se o token não for encontrado, este erro aparecerá nos logs da Vercel.
        console.error("ALERTA CRÍTICO: A variável de ambiente MERCADOPAGO_ACCESS_TOKEN não foi encontrada ou está vazia!");
        
        // Retorna um erro claro para o frontend, indicando um problema de configuração no servidor.
        return res.status(500).json({ message: "Erro de configuração no servidor: Access Token não configurado." });
    }
    
    console.log("Variável de ambiente encontrada. Início do token:", accessToken.substring(0, 10) + "...");
    // --- FIM DO CÓDIGO DE DEPURAÇÃO ---


    // Verifica se o método da requisição é POST, que é o esperado
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // Inicializa o cliente do Mercado Pago com o token validado
        const client = new MercadoPagoConfig({ accessToken });
        const preference = new Preference(client);

        // Pega os dados enviados pelo frontend
        const { sessionId, payerEmail } = req.body;

        // Validação dos dados recebidos
        if (!sessionId || !payerEmail) {
            return res.status(400).json({ message: "sessionId e payerEmail são obrigatórios no corpo da requisição." });
        }

        // Cria o objeto da preferência de pagamento
        const preferenceData = {
            body: {
                // Define que é um pagamento padrão
                purpose: 'wallet_purchase',
                items: [
                    {
                        title: 'Acesso por 1 hora à Ferramenta de Correção',
                        quantity: 1,
                        unit_price: 1.00,
                        currency_id: 'BRL',
                    }
                ],
                // Usa o e-mail recebido do frontend
                payer: {
                    email: payerEmail,
                },
                // Usa a sessionId para rastreamento
                external_reference: sessionId,
            }
        };

        // Cria a preferência na API do Mercado Pago
        const result = await preference.create(preferenceData);

        console.log(`Preferência criada com sucesso para a sessão ${sessionId}. ID: ${result.id}`);

        // Retorna o ID da preferência para o frontend
        return res.status(201).json({ preferenceId: result.id });

    } catch (error) {
        // Captura e loga qualquer erro que a API do Mercado Pago retorne
        console.error("ERRO AO CRIAR PREFERÊNCIA NA API DO MP:", error);

        // Retorna uma mensagem de erro útil para o frontend
        const errorMessage = error.cause?.message || error.message || "Falha desconhecida ao criar preferência de pagamento.";
        return res.status(500).json({ message: errorMessage });
    }
}
