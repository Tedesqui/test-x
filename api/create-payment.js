export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const asaasApiKey = process.env.ASAAS_API_KEY;

    if (!asaasApiKey) {
        console.error("ERRO CRÍTICO: A variável de ambiente ASAAS_API_KEY não foi encontrada.");
        return response.status(500).json({
            error: "Erro de configuração do servidor.",
            details: "A chave de API para pagamentos não está configurada."
        });
    }

    try {
        const { sessionId, email, currency } = request.body;

        if (!sessionId || !email || !currency) {
            return response.status(400).json({ error: 'Dados insuficientes na requisição (sessionId, email, currency).' });
        }

        const ASAAS_API_URL = 'https://api.asaas.com/v3/paymentLinks';
        let chargeValue = 14.90;
        let linkName = 'Acesso Semanal - Correção IA';

        if (currency === 'USD') {
            const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (!exchangeResponse.ok) throw new Error('Falha ao buscar dados da API de câmbio.');
            const exchangeData = await exchangeResponse.json();
            const usdToBrlRate = exchangeData.rates.BRL;

            if (!usdToBrlRate) throw new Error('Não foi possível obter a taxa de câmbio USD-BRL.');

            const baseValueInBrl = 3 * usdToBrlRate;
            chargeValue = parseFloat((baseValueInBrl * 1.03).toFixed(2));
            linkName = 'Weekly Access - AI Proofreader';
        }

        const successUrl = `https://${request.headers.host}`;

        const linkBody = {
            name: linkName,
            description: 'Acesso por 1 semana à ferramenta de correção de provas com IA.',
            value: chargeValue,
            chargeType: "DETACHED",
            dueDateLimitDays: 2,

            // --- ALTERAÇÃO AQUI ---
            // Removemos "billingType" e adicionamos "allowedBillingTypes"
            // para permitir apenas PIX e Cartão de Crédito.
            "allowedBillingTypes": [
                "PIX",
                "CREDIT_CARD"
            ],
            
            "callback": {
                "autoRedirect": true,
                "successUrl": successUrl,
            },
            "notification": {
                "enabled": true,
                "payload": JSON.stringify({ sessionId, email })
            }
        };

        const linkResponse = await fetch(ASAAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
            body: JSON.stringify(linkBody),
        });

        if (!linkResponse.ok) {
            const errorDetails = await linkResponse.json();
            console.error("Erro recebido da API do Asaas:", JSON.stringify(errorDetails, null, 2));
            throw new Error(errorDetails.errors?.[0]?.description || 'Falha ao gerar link de pagamento no Asaas.');
        }

        const result = await linkResponse.json();
        
        return response.status(201).json({
            checkoutUrl: result.url,
        });

    } catch (error) {
        console.error("Erro 500 na função create-payment:", error);
        return response.status(500).json({
            error: "Ocorreu um erro interno no servidor.",
            details: error.message
        });
    }
}
