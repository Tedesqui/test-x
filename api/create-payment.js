export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { sessionId, email, currency } = request.body;
    const asaasApiKey = process.env.ASAAS_API_KEY;

    if (!asaasApiKey || !sessionId || !email || !currency) {
        return response.status(400).json({ error: 'Dados insuficientes ou configuração do servidor ausente.' });
    }

    const ASAAS_API_URL = 'https://api.asaas.com/v3/paymentLinks';
    let chargeValue = 14.90;
    let linkName = 'Acesso Semanal - Correção IA';

    try {
        if (currency === 'USD') {
            const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const exchangeData = await exchangeResponse.json();
            const usdToBrlRate = exchangeData.rates.BRL;
            if (!usdToBrlRate) throw new Error('Não foi possível obter a taxa de câmbio.');
            
            const baseValueInBrl = 3 * usdToBrlRate;
            chargeValue = parseFloat((baseValueInBrl * 1.03).toFixed(2));
            linkName = 'Weekly Access - AI Proofreader';
        }

        const linkBody = {
            name: linkName,
            description: 'Acesso por 1 semana à ferramenta de correção de provas com IA.',
            value: chargeValue,
            billingType: "UNDEFINED", // Permite que o cliente escolha PIX ou Cartão de Crédito
            chargeType: "DETACHED", // Cobrança avulsa
            // Após o pagamento, Asaas adicionará '?payment=ID_DO_PAGAMENTO' à URL
            "callback": {
                "autoRedirect": true,
                "successUrl": `https://${request.headers.host}/index.html` 
            },
            // Vamos associar o cliente e a sessão na notificação que o Asaas nos enviará (webhook)
            "notification": {
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
            console.error("Erro ao criar link de pagamento no Asaas:", errorDetails);
            throw new Error('Falha ao gerar link de pagamento no Asaas.');
        }

        const result = await linkResponse.json();
        
        // Retorna a URL do checkout para o frontend redirecionar o usuário
        response.status(201).json({
            checkoutUrl: result.url,
        });

    } catch (error) {
        console.error("Erro no processo de criação de pagamento Asaas:", error);
        response.status(500).json({ error: 'Falha ao criar pagamento.', details: error.message });
    }
}
