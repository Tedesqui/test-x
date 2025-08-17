export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { sessionId, email } = request.body;
    const asaasApiKey = process.env.ASAAS_API_KEY;

    if (!asaasApiKey || !sessionId || !email) {
        return response.status(400).json({ error: 'Dados insuficientes ou configuração do servidor ausente.' });
    }

    const ASAAS_API_URL = 'https://api.asaas.com/v3';
    // Para ambiente de testes, use: 'https://sandbox.asaas.com/api/v3'

    try {
        let customerResponse = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, {
            headers: { 'access_token': asaasApiKey }
        });
        let customerData = await customerResponse.json();
        let customerId;

        if (customerData.data && customerData.data.length > 0) {
            customerId = customerData.data[0].id;
        } else {
            const newCustomerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
                body: JSON.stringify({ name: email, email: email, externalReference: email })
            });
            const newCustomerData = await newCustomerResponse.json();
            customerId = newCustomerData.id;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const paymentBody = {
            customer: customerId,
            billingType: 'PIX',
            value: 14.90,
            dueDate: dueDate.toISOString().split('T')[0],
            description: 'Acesso por 1 semana à Correção de Prova com IA',
            externalReference: sessionId,
        };

        const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
            body: JSON.stringify(paymentBody),
        });

        if (!paymentResponse.ok) {
            throw new Error(JSON.stringify(await paymentResponse.json()));
        }

        const result = await paymentResponse.json();
        
        response.status(201).json({
            qrCode: result.pixQrCode.payload,
            qrCodeBase64: result.pixQrCode.encodedImage,
        });

    } catch (error) {
        console.error("Erro no Asaas (create-payment):", error.message);
        response.status(500).json({ error: 'Falha ao criar pagamento.', details: error.message });
    }
}
