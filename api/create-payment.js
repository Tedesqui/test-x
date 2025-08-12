import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !sessionId) {
    return response.status(500).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }
  
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    // --- INÍCIO DA ALTERAÇÃO ---
    // Calcula a data de expiração para daqui a 1 hora
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);
    // --- FIM DA ALTERAÇÃO ---

    const result = await preference.create({
      body: {
        items: [{
          id: 'acesso_correcao_ia_1h',
          title: 'Acesso por 1 hora à Correção de Prova com IA',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 1.00,
        }],
        back_urls: {
            success: `https://prova-projeto.vercel.app/index.html?payment_status=success`,
            failure: `https://prova-projeto.vercel.app/index.html?payment_status=failure`,
            pending: `https://prova-projeto.vercel.app/index.html?payment_status=pending`,
        },
        auto_return: 'approved',
        external_reference: sessionId,
        
        // --- ADIÇÃO DA DATA DE EXPIRAÇÃO ---
        // Define que a preferência (e o PIX gerado) expira em 1 hora
        date_of_expiration: expirationDate.toISOString(),
      }
    });
    
    response.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("Erro ao criar preferência no Mercado Pago:", error);
    response.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
  }
}
