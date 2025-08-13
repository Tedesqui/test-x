import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.query;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !sessionId) {
    return response.status(400).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }

  // --- INÍCIO DO DIAGNÓSTICO ---
  console.log(`🔎 Verificando status para sessionId: ${sessionId}`);
  // --- FIM DO DIAGNÓSTICO ---

  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    const searchResult = await payment.search({
      options: {
        external_reference: sessionId,
        sort: 'date_created',
        order: 'desc'
      }
    });

    // --- INÍCIO DO DIAGNÓSTICO ---
    console.log(`📦 Resultado da busca no MP:`, JSON.stringify(searchResult, null, 2));
    // --- FIM DO DIAGNÓSTICO ---

    if (searchResult.results && searchResult.results.length > 0) {
      const latestPayment = searchResult.results[0];
      
      // --- INÍCIO DO DIAGNÓSTICO ---
      console.log(`❗ Status do último pagamento encontrado [${latestPayment.id}]: ${latestPayment.status}`);
      // --- FIM DO DIAGNÓSTICO ---

      if (latestPayment.status === 'approved') {
        console.log(`✅ Pagamento APROVADO para sessionId: ${sessionId}. Liberando acesso.`);
        return response.status(200).json({ paid: true });
      }
    } else {
      console.log(`🤔 Nenhum pagamento encontrado para a sessionId: ${sessionId}`);
    }

    // Se chegou até aqui, o pagamento não foi aprovado ainda.
    return response.status(200).json({ paid: false });

  } catch (error) {
    console.error("❌ Erro ao verificar status no Mercado Pago:", error);
    return response.status(500).json({ error: 'Falha ao verificar o status do pagamento.' });
  }
}
