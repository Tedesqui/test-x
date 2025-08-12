import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(request, response) {
  const { sessionId } = request.query;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!sessionId) {
    return response.status(400).json({ error: 'sessionId é obrigatório.' });
  }
  
  if (!accessToken) {
    console.error("MERCADO_PAGO_ACCESS_TOKEN não encontrado.");
    return response.status(500).json({ error: "Erro de configuração no servidor." });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    // Busca por pagamentos com a referência externa igual à nossa sessionId
    const searchResult = await payment.search({
      options: {
        external_reference: sessionId,
        sort: 'date_created',
        criteria: 'desc',
        limit: 1 // Queremos apenas o mais recente
      }
    });

    const latestPayment = searchResult?.results?.[0];

    // Verifica se o pagamento mais recente para esta sessão foi aprovado
    if (latestPayment && latestPayment.status === 'approved') {
      return response.status(200).json({ paid: true });
    } else {
      return response.status(200).json({ paid: false });
    }
  } catch (error) {
    console.error("Erro ao verificar status no Mercado Pago:", error);
    return response.status(500).json({ error: 'Erro ao consultar o status do pagamento.' });
  }
}
