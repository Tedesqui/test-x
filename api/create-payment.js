// Importa o SDK do Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Handler da Vercel Serverless Function
export default async function handler(request, response) {
  // Garante que o método da requisição seja POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Pega o seu Access Token das Váriaveis de Ambiente da Vercel (mais seguro)
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Access Token do Mercado Pago não encontrado.");
    return response.status(500).json({ error: 'Erro de configuração no servidor.' });
  }

  // Inicializa o cliente do Mercado Pago
  const client = new MercadoPagoConfig({ accessToken: accessToken });
  const preferenceClient = new Preference(client);

  try {
    // Corpo da preferência de pagamento com os dados do produto e URLs de retorno
    const preferenceData = {
      items: [
        {
          id: 'correcao-ia-1h',
          title: 'Acesso por 1 hora à Correção de Prova com IA',
          description: 'Acesso à ferramenta de correção por inteligência artificial durante 60 minutos.',
          quantity: 1,
          currency_id: 'BRL', // Moeda Real Brasileiro
          unit_price: 1.00,
        },
      ],
      // URLs para onde o usuário será redirecionado após o pagamento
      back_urls: {
        success: 'https://prova-projeto.vercel.app/?status=success',
        failure: 'https://prova-projeto.vercel.app/?status=failure',
        pending: 'https://prova-projeto.vercel.app/?status=pending',
      },
      // Redireciona automaticamente para a URL de sucesso após a aprovação
      auto_return: 'approved',
    };

    console.log("Criando preferência com os dados:", preferenceData);

    // Cria a preferência de pagamento
    const result = await preferenceClient.create({ body: preferenceData });

    console.log("Preferência criada com sucesso. ID:", result.id);

    // Retorna o ID da preferência para o frontend
    return response.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("Erro ao criar preferência no Mercado Pago:", error);
    return response.status(500).json({ 
        error: 'Falha ao comunicar com o Mercado Pago.',
        details: error.message 
    });
  }
}
