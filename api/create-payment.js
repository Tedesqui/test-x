import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://prova-projeto.vercel.app"; 

  if (!accessToken || !sessionId) {
    return response.status(500).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }
  
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const preferenceData = {
      body: {
        items: [{
          id: 'acesso_correcao_ia_1h',
          title: 'Acesso por 1 hora à Correção de Prova com IA',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 1.00,
        }],
        // ---- INÍCIO DA MUDANÇA PRINCIPAL ----
        // Forma mais direta de solicitar o PIX.
        // Isso instrui a API a usar PIX como método de pagamento padrão.
        payment_methods: {
          default_payment_method_id: 'pix',
        },
        // ---- FIM DA MUDANÇA PRINCIPAL ----
        
        // Vamos deixar o MP definir a expiração do PIX por padrão.
        // E removemos a URL de notificação daqui para simplificar o pedido ao máximo.
        // A URL de webhook configurada no painel já é suficiente.
        external_reference: sessionId,
      }
    };

    const result = await preference.create(preferenceData);
    
    // Mantemos o log de diagnóstico para o caso de o erro persistir.
    console.log("Resposta completa do MP:", JSON.stringify(result, null, 2));
    
    const pixData = result.point_of_interaction?.transaction_data;

    if (!pixData) {
        throw new Error("Não foi possível obter os dados do PIX na resposta da API.");
    }
    
    response.status(201).json({ 
        preferenceId: result.id,
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
    });

  } catch (error) {
    console.error("Erro ao criar preferência no Mercado Pago:", error);
    // Extrai a causa do erro, se disponível, para um log mais claro
    const errorMessage = error.cause?.message || error.message;
    console.error("Detalhes do erro:", errorMessage);
    
    response.status(500).json({ 
        error: 'Falha ao criar preferência de pagamento.',
        details: errorMessage 
    });
  }
}
