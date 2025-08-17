export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const asaasApiKey = process.env.ASAAS_API_KEY;

    if (!asaasApiKey) {
        console.error("ERRO CRÍTICO: A variável de ambiente ASAAS_API_KEY não foi encontrada.");
        return response.status(500).json({ error: "Erro de configuração do servidor." });
    }

    try {
        const { sessionId, email, currency } = request.body;

        if (!sessionId || !email || !currency) {
            return response.status(400).json({ error: 'Dados insuficientes na requisição.' });
        }

        const ASAAS_API_URL = 'https://api.asaas.com/v3';
        let customerId;

        // --- LÓGICA ROBUSTA DE CRIAÇÃO/BUSCA DE CLIENTE ---
        // 1. Busca o cliente pelo e-mail para evitar duplicatas.
        const searchCustomerResponse = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, {
            headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
        });
        const searchCustomerData = await searchCustomerResponse.json();

        if (searchCustomerData.data && searchCustomerData.data.length > 0) {
            customerId = searchCustomerData.data[0].id;
            console.log(`Cliente encontrado com ID: ${customerId}`);
        } else {
            // 2. Se não encontrar, cria um novo cliente com a flag correta.
            console.log(`Cliente não encontrado. Criando novo cliente para o email: ${email}`);
            
            const newCustomerBody = {
                name: email.split('@')[0], // Pega o nome do email como padrão
                email: email,
            };

            // **AQUI ESTÁ A MÁGICA**
            // Se a moeda não for BRL, marcamos o cliente como estrangeiro.
            if (currency !== 'BRL') {
                newCustomerBody.foreignCustomer = true;
            }
            
            const createCustomerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
                body: JSON.stringify(newCustomerBody)
            });

            if (!createCustomerResponse.ok) {
                const errorDetails = await createCustomerResponse.json();
                console.error("Erro ao criar cliente no Asaas:", errorDetails);
                throw new Error("Não foi possível registrar o cliente no sistema de pagamentos.");
            }

            const newCustomerData = await createCustomerResponse.json();
            customerId = newCustomerData.id;
            console.log(`Novo cliente estrangeiro criado com ID: ${customerId}`);
        }
        
        // --- LÓGICA DO LINK DE PAGAMENTO (agora usando o customerId) ---
        let chargeValue = 14.90;
        let linkName = 'Acesso Semanal / Weekly Access';
        let linkDescription = 'Acesso de 1 semana à ferramenta de IA. / 1-week access to the AI tool.';

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
            billingType: "UNDEFINED",
            allowedBillingTypes: ["PIX", "CREDIT_CARD", "BOLETO"],
            customer: customerId, // Associamos o link ao cliente correto
            callback: {
                autoRedirect: true,
                successUrl: `https://${request.headers.host}`,
            }
        };

        const linkResponse = await fetch(`${ASAAS_API_URL}/paymentLinks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
            body: JSON.stringify(linkBody),
        });

        if (!linkResponse.ok) {
            const errorDetails = await linkResponse.json();
            console.error("Erro ao criar link de pagamento no Asaas:", errorDetails);
            throw new Error(errorDetails.errors?.[0]?.description || 'Falha ao gerar link de pagamento no Asaas.');
        }

        const result = await linkResponse.json();
        
        return response.status(201).json({
            checkoutUrl: result.url,
        });

    } catch (error) {
        console.error("Erro 500 na função create-payment:", error);
        return response.status(500).json({ error: "Ocorreu um erro interno no servidor.", details: error.message });
    }
}
