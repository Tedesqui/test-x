export default async function handler(request, response) {
    console.log("--- EXECUTANDO create-payment.js - VERSÃO FINAL ---"); // Log de versão

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const asaasApiKey = process.env.ASAAS_API_KEY;
    if (!asaasApiKey) {
        console.error("ERRO CRÍTICO: ASAAS_API_KEY não encontrada.");
        return response.status(500).json({ error: "Erro de configuração do servidor." });
    }

    try {
        const { sessionId, email, currency } = request.body || {};
        console.log(`[DEBUG] Moeda recebida do frontend: >>> ${currency} <<<`);

        if (!sessionId || !email || !currency) {
            return response.status(400).json({ error: 'Dados insuficientes na requisição.' });
        }

        const ASAAS_API_URL = 'https://api.asaas.com/v3';
        let customerId;
        // ... Lógica para buscar/criar cliente ... (mantida)

        let chargeValue = 14.90;
        // ... Lógica de cálculo de valor ... (mantida)
        
        let allowedTypes;
        if (currency === 'BRL') {
            allowedTypes = ["PIX", "CREDIT_CARD", "BOLETO"];
            console.log("[DEBUG] DECISÃO: Moeda é BRL. Permitindo PIX, Cartão, Boleto.");
        } else {
            allowedTypes = ["CREDIT_CARD"];
            console.log("[DEBUG] DECISÃO: Moeda NÃO é BRL. Permitindo APENAS Cartão de Crédito.");
        }
        
        const linkBody = {
             // ... corpo do link de pagamento ... (mantido, com dueDateLimitDays)
            allowedBillingTypes: allowedTypes,
             // ...
        };
        
        const linkResponse = await fetch(`${ASAAS_API_URL}/paymentLinks`, { /* ... */ });
        
        if (!linkResponse.ok) { /* ... */ }

        const result = await linkResponse.json();
        return response.status(201).json({ checkoutUrl: result.url });

    } catch (error) {
        // ...
    }
}
