export default async function handler(request, response) {
    console.log("--- EXECUTANDO create-payment.js - v3 (Foreigner Fix) ---");

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

        // Lógica de cliente (mantida)
        const searchCustomerResponse = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, { headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey } });
        const searchCustomerData = await searchCustomerResponse.json();
        if (searchCustomerData.data && searchCustomerData.data.length > 0) {
            customerId = searchCustomerData.data[0].id;
        } else {
            const newCustomerBody = { name: email.split('@')[0], email: email };
            if (currency !== 'BRL') {
                newCustomerBody.foreignCustomer = true;
            }
            const createCustomerResponse = await fetch(`${ASAAS_API_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey }, body: JSON.stringify(newCustomerBody) });
            if (!createCustomerResponse.ok) throw new Error("Não foi possível registrar o cliente.");
            const newCustomerData = await createCustomerResponse.json();
            customerId = newCustomerData.id;
        }
        
        let chargeValue = 14.90;
        const linkName = 'Weekly Access / Acesso Semanal';
        const linkDescription = '1-week access to the AI tool. / Acesso de 1 semana à ferramenta de IA.';
        if (currency === 'USD') {
            const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const exchangeData = await exchangeResponse.json();
            chargeValue = parseFloat((3 * exchangeData.rates.BRL * 1.03).toFixed(2));
        }

        const linkBody = {
            name: linkName,
            description: linkDescription,
            value: chargeValue,
            chargeType: "DETACHED",
            dueDateLimitDays: 2,
            customer: customerId,
            callback: {
                autoRedirect: true,
                successUrl: `https://${request.headers.host}`,
            }
        };

        // --- LÓGICA DE PAGAMENTO CORRIGIDA ---
        if (currency === 'BRL') {
            console.log("[DEBUG] Cliente brasileiro. Criando link com múltiplas opções.");
            linkBody.billingType = "UNDEFINED";
            linkBody.allowedBillingTypes = ["PIX", "CREDIT_CARD", "BOLETO"];
        } else {
            console.log("[DEBUG] Cliente estrangeiro. Criando link exclusivo para Cartão de Crédito.");
            linkBody.billingType = "CREDIT_CARD";
            // Para um tipo específico, não usamos 'allowedBillingTypes'
        }
        // --- FIM DA LÓGICA ---
        
        const linkResponse = await fetch(`${ASAAS_API_URL}/paymentLinks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
            body: JSON.stringify(linkBody),
        });

        if (!linkResponse.ok) {
            const errorDetails = await linkResponse.json();
            console.error("Erro recebido da API do Asaas ao criar link:", JSON.stringify(errorDetails, null, 2));
            throw new Error(errorDetails.errors?.[0]?.description || 'Falha ao gerar link de pagamento no Asaas.');
        }

        const result = await linkResponse.json();
        return response.status(201).json({ checkoutUrl: result.url });

    } catch (error) {
        console.error("Erro 500 na função create-payment:", error);
        return response.status(500).json({ error: "Ocorreu um erro interno no servidor.", details: error.message });
    }
}
