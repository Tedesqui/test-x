import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // MUDANÇA: Agora esperamos também o 'email' no corpo da requisição
  const { sessionId, email } = request.body;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  // Adicionamos a validação do e-mail
  if (!accessToken || !sessionId || !email) {
    return response.status(400).json({ error: 'Dados insuficientes: sessionId, email ou configuração do servidor ausente.' });
  }
  
  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    const paymentData = {
      body: {
        transaction_amount: 1.00,
        description: 'Acesso por 1 hora à Correção de Prova com IA',
        payment_method_id: 'pix',
        external_reference: sessionId,
        payer: {
          // MUDANÇA: Usamos o e-mail fornecido pelo usuário
          email: email,
        },
      }
    };

    const result = await payment.create(paymentData);
    const pixData = result.point_of_interaction?.transaction_data;

    if (!pixData) {
        console.error("A API de Pagamento não retornou os dados do PIX. Resposta:", JSON.stringify(result, null, 2));
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
