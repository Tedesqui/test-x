export default async function handler(request, response) {
    // --- PONTO DE DEPURAÇÃO NO BACKEND ---
    console.log("--- FUNÇÃO /api/create-payment INVOCADA ---");
    console.log("Método da Requisição:", request.method);
    console.log("Corpo da Requisição (request.body):", request.body);
    // ----------------------------------------

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const asaasApiKey = process.env.ASAAS_API_KEY;
    if (!asaasApiKey) {
        console.error("ERRO CRÍTICO: ASAAS_API_KEY não encontrada.");
        return response.status(500).json({ error: "Erro de configuração do servidor." });
    }

    try {
        // Usamos um fallback para garantir que o body não seja nulo
        const { sessionId, email, currency } = request.body || {};

        // --- PONTO DE DEPURAÇÃO NO BACKEND ---
        console.log(`Moeda recebida e processada pelo backend: ${currency}`);
        // ----------------------------------------
        
        if (!sessionId || !email || !currency) {
            console.error("Dados insuficientes no corpo da requisição:", request.body);
            return response.status(400).json({ error: 'Dados insuficientes na requisição.' });
        }

        // (O resto do seu código continua aqui, sem alterações...)
        const ASAAS_API_URL = 'https://api.asaas.com/v3';
        let customerId;
        // ... Lógica para buscar/criar cliente ...
        // ...
        let chargeValue = 14.90;
        // ... Lógica de cálculo de valor ...
        // ...

        let allowedTypes;
        if (currency === 'BRL') {
            allowedTypes = ["PIX", "CREDIT_CARD", "BOLETO"];
            console.log("Lógica BRL acionada. Métodos permitidos:", allowedTypes);
        } else {
            allowedTypes = ["CREDIT_CARD"];
            console.log("Lógica para Estrangeiro (não-BRL) acionada. Métodos permitidos:", allowedTypes);
        }
        
        const linkBody = {
            // ... corpo do link de pagamento ...
            allowedBillingTypes: allowedTypes,
            // ...
        };
        // ... resto da função
        // ...

        const linkResponse = await fetch(`${ASAAS_API_URL}/paymentLinks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
            body: JSON.stringify(linkBody),
        });

        if (!linkResponse.ok) {
            const errorDetails = await linkResponse.json();
            throw new Error(errorDetails.errors?.[0]?.description || 'Falha ao gerar link de pagamento no Asaas.');
        }

        const result = await linkResponse.json();
        return response.status(201).json({ checkoutUrl: result.url });

    } catch (error) {
        console.error("Erro 500 na função create-payment:", error);
        return response.status(500).json({ error: "Ocorreu um erro interno no servidor.", details: error.message });
    }
}
