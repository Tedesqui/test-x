import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  // Substitua pela URL base do seu site em produção
  const siteUrl = "https://prova-projeto.vercel.app"; 

  if (!accessToken || !sessionId) {
    return response.status(500).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }
  
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    // Define a expiração do PIX para 30 minutos a partir de agora.
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 30);

    const preferenceData = {
      body: {
        items: [{
          id: 'acesso_correcao_ia_1h',
          title: 'Acesso por 1 hora à Correção de Prova com IA',
          description: 'Acesso temporário à ferramenta de correção por IA',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 1.00,
        }],
        payment_methods: {
          // Define PIX como o único método de pagamento aceito
          excluded_payment_types: [
            { id: 'ticket' }, // Boleto
            { id: 'credit_card' },
            { id: 'debit_card' }
          ],
          installments: 1
        },
        // A referência externa é crucial para vincular o pagamento à sessão do usuário
        external_reference: sessionId,
        // URL para onde o Mercado Pago enviará notificações de status (webhook)
        notification_url: `${siteUrl}/api/webhook`,
        // Define a data e hora que o PIX irá expirar
        date_of_expiration: expirationDate.toISOString(),
      }
    };

    const result = await preference.create(preferenceData);
    
    // Extrai os dados do PIX da resposta para enviar ao frontend
    const pixData = result.point_of_interaction?.transaction_data;

    if (!pixData) {
        throw new Error("Não foi possível obter os dados do PIX. Verifique suas credenciais do Mercado Pago.");
    }
    
    response.status(201).json({ 
        preferenceId: result.id,
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
    });

  } catch (error) {
    console.error("Erro ao criar preferência no Mercado Pago:", error);
    response.status(500).json({ 
        error: 'Falha ao criar preferência de pagamento.',
        details: error.message 
    });
  }
}
