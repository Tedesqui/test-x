export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { sessionId } = request.query;
    const asaasApiKey = process.env.ASAAS_API_KEY;

    if (!asaasApiKey || !sessionId) {
        return response.status(400).json({ error: 'Configuração do servidor ou sessionId ausente.' });
    }

    const ASAAS_API_URL = `https://api.asaas.com/v3/payments?externalReference=${sessionId}`;
     // Para ambiente de testes, use: `https://sandbox.asaas.com/api/v3/payments?externalReference=${sessionId}`

    try {
        const searchResponse = await fetch(ASAAS_API_URL, {
            method: 'GET',
            headers: { 'access_token': asaasApiKey },
        });

        if (!searchResponse.ok) {
            throw new Error(JSON.stringify(await searchResponse.json()));
        }

        const searchResult = await searchResponse.json();

        if (searchResult.data && searchResult.data.length > 0) {
            const latestPayment = searchResult.data[0];
            if (latestPayment.status === 'RECEIVED' || latestPayment.status === 'CONFIRMED') {
                return response.status(200).json({ paid: true });
            }
        }
        
        return response.status(200).json({ paid: false });

    } catch (error) {
        console.error("Erro no Asaas (check-status):", error.message);
        return response.status(500).json({ error: 'Falha ao verificar o status do pagamento.', details: error.message });
    }
}
