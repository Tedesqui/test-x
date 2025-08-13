// Importa as bibliotecas necessárias
const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require('cors');

// Inicializa o Express
const app = express();
app.use(cors()); // Permite requisições de outros domínios (seu frontend)
app.use(express.json()); // Permite que o servidor entenda JSON

// IMPORTANTE: Configure seu Access Token do Mercado Pago
// É uma prática de segurança usar variáveis de ambiente.
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
    console.error("ERRO CRÍTICO: MERCADOPAGO_ACCESS_TOKEN não foi definido.");
    process.exit(1);
}

// Inicializa o cliente do Mercado Pago com seu token
const client = new MercadoPagoConfig({ accessToken });
const payment = new Payment(client);


// ROTA CORRIGIDA PARA VERIFICAR O STATUS DO PAGAMENTO
//======================================================================
app.get("/api/check-status", async (req, res) => {
    // 1. Pega a sessionId enviada pelo frontend na URL
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ message: "O parâmetro sessionId é obrigatório." });
    }

    try {
        console.log(`Verificando status para a sessão: ${sessionId}`);

        // 2. Busca os pagamentos no Mercado Pago
        const paymentSearch = await payment.search({
            options: {
                // Usa a sessionId para encontrar o pagamento correspondente
                external_reference: sessionId,
                
                // CRÍTICO: Usa os parâmetros corretos para ordenação
                // para pegar o pagamento mais recente primeiro.
                sort: 'date_created',
                criteria: 'desc'
            }
        });

        const payments = paymentSearch.results;

        // 3. Verifica os resultados da busca
        if (payments && payments.length > 0) {
            // Pega o pagamento mais recente da lista (o primeiro)
            const latestPayment = payments[0];
            
            console.log(`Pagamento encontrado: ID ${latestPayment.id}, Status: ${latestPayment.status}`);
            
            // 4. Se o status for "aprovado", retorna 'paid: true'
            if (latestPayment.status === 'approved') {
                return res.json({ paid: true });
            }
        }
        
        // 5. Se não encontrou pagamentos ou nenhum foi aprovado, retorna 'paid: false'
        return res.json({ paid: false });

    } catch (error) {
        // Em caso de erro na comunicação com a API do Mercado Pago
        console.error("Erro ao verificar status no Mercado Pago:", error);
        // Retorna um erro genérico para o frontend não travar
        return res.status(500).json({ message: "Erro interno ao verificar status do pagamento." });
    }
});
//======================================================================


// Rota de exemplo para testar se o servidor está no ar
app.get("/", (req, res) => {
    res.send("Servidor de pagamento está funcionando.");
});


// Inicia o servidor na porta 3001 (ou outra de sua preferência)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
