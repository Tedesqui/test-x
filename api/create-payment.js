export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Agora recebemos a moeda do frontend
    const { sessionId, email, currency } = request.body;
    const asaasApiKey = process.env.ASAAS_API_KEY;

    if (!asaasApiKey || !sessionId || !email || !currency) {
        return response.status(400).json({ error: 'Dados insuficientes ou configuração do servidor ausente.' });
    }

    const ASAAS_API_URL = 'https://api.asaas.com/v3';
    let chargeValue = 14.90; // Valor padrão em BRL
    let chargeDescription = 'Acesso por 1 semana à Correção de Prova com IA';

    try {
        // --- LÓGICA DE PRECIFICAÇÃO DINÂMICA ---
        if (currency === 'USD') {
            // 1. Busca a taxa de câmbio atual de USD para BRL
            console.log('Moeda USD detectada, buscando taxa de câmbio...');
            const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const exchangeData = await exchangeResponse.json();
            const usdToBrlRate = exchangeData.rates.BRL;

            if (!usdToBrlRate) {
                throw new Error('Não foi possível obter a taxa de câmbio USD-BRL.');
            }

            console.log(`Taxa de câmbio atual: 1 USD = ${usdToBrlRate} BRL`);

            // 2. Calcula o valor em BRL e adiciona uma pequena margem (ex: 3%) para cobrir flutuações e taxas
            const baseValueInBrl = 3 * usdToBrlRate;
            const finalValueInBrl = baseValueInBrl * 1.03; // Adiciona margem de 3%
            
            chargeValue = parseFloat(finalValueInBrl.toFixed(2));
            chargeDescription = 'Weekly Access to AI Proofreader (Approx. $3.00 USD)';
            console.log(`Valor a ser cobrado em BRL: ${chargeValue}`);
        }
        // --- FIM DA LÓGICA ---

        // A lógica de criar/buscar cliente no Asaas permanece a mesma
        let customerResponse = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, {
            headers: { 'access_token': asaasApiKey }
        });
        let customerData = await customerResponse.json();
        let customerId = customerData.data && customerData.data.length > 0 ? customerData.data[0].id : null;

        if (!customerId) {
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

        // Usa os valores dinâmicos de `chargeValue` e `chargeDescription`
        const paymentBody = {
            customer: customerId,
            billingType: 'PIX',
            value: chargeValue,
            dueDate: dueDate.toISOString().split('T')[0],
            description: chargeDescription,
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
