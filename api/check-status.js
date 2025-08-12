import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(request, response) {
  // 1. Validar que o método é GET
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Obter o sessionId da URL
  const { sessionId } = request.query;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !sessionId) {
    return response.status(400).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }

  // 3. Configurar o cliente do Mercado Pago
  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    // 4. Buscar pagamentos usando a sessionId e ordenando pelo mais recente
    const searchResult = await payment.search({
      options: {
        external_reference: sessionId,
        sort: 'date_created', // Ordena pela data de criação
        order: 'desc'         // 'desc' para o mais recente primeiro
      }
    });

    // 5. Verificar o status do pagamento mais recente
    if (searchResult.results && searchResult.results.length > 0) {
      const latestPayment = searchResult.results[0]; // Pega o pagamento mais recente

      if (latestPayment.status === 'approved') {
        // Se o pagamento mais recente foi aprovado, libera o acesso
        return response.status(200).json({ paid: true });
      }
    }

    // Se não encontrou pagamentos ou o mais recente não está 'approved', continua aguardando
    return response.status(200).json({ paid: false });

  } catch (error) {
    console.error("Erro ao verificar status no Mercado Pago:", error);
    return response.status(500).json({ error: 'Falha ao verificar o status do pagamento.' });
  }
}
