import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body; // Recebemos a sessionId do frontend
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !sessionId) {
    return response.status(500).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }
  
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
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
        // ===== ADIÇÃO IMPORTANTE AQUI =====
        // Vincula este pagamento à sessão do navegador do usuário
        external_reference: sessionId,
      }
    });
    
    response.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("Erro ao criar preferência no Mercado Pago:", error);
    response.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
  }
}
