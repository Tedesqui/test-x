import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !sessionId) {
    return response.status(500).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }
  
  // 1. MUDANÇA: Agora usamos 'Payment' em vez de 'Preference'
  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    // 2. MUDANÇA: O corpo do pedido para a API de Pagamentos é diferente
    const paymentData = {
      body: {
        transaction_amount: 1.00,
        description: 'Acesso por 1 hora à Correção de Prova com IA',
        payment_method_id: 'pix', // Especificamos PIX diretamente
        external_reference: sessionId, // Mantemos nosso rastreador
        payer: {
          // A API de Pagamentos exige um e-mail. Como não temos o do usuário,
          // geramos um e-mail aleatório para cumprir o requisito.
          email: `user_${sessionId.substring(0, 8)}@example.com`,
        },
      }
    };

    const result = await payment.create(paymentData);

    // 3. MUDANÇA: A estrutura da resposta é a mesma, mas agora ela é garantida.
    const pixData = result.point_of_interaction?.transaction_data;

    if (!pixData) {
        // Se mesmo assim falhar, o log abaixo nos dará a razão.
        console.error("Resposta do MP (API de Pagamento):", JSON.stringify(result, null, 2));
        throw new Error("A API de Pagamento não retornou os dados do PIX.");
    }
    
    response.status(201).json({ 
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
    });

  } catch (error) {
    console.error("Erro ao criar pagamento direto no Mercado Pago:", error);
    const errorMessage = error.cause?.api_response?.data?.message || error.message;
    console.error("Detalhes do erro:", errorMessage);
    
    response.status(500).json({ 
        error: 'Falha ao criar pagamento direto.',
        details: errorMessage 
    });
  }
}
