import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(request, response) {
  // 1. Validar que o método é GET
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Obter o sessionId da URL (ex: /api/check-status?sessionId=...)
  const { sessionId } = request.query;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !sessionId) {
    return response.status(400).json({ error: 'Configuração do servidor ou sessionId ausente.' });
  }

  // 3. Configurar o cliente do Mercado Pago
  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    // 4. Buscar pagamentos usando a sessionId como external_reference
    const payments = await payment.search({
      options: {
        external_reference: sessionId,
      }
    });

    // 5. Verificar se algum pagamento foi encontrado e se está aprovado
    const foundPayment = payments.results?.find(p => p.status === 'approved');

    if (foundPayment) {
      // Se encontrou um pagamento aprovado, retorna 'paid: true'
      return response.status(200).json({ paid: true });
    } else {
      // Se não, retorna 'paid: false' para o frontend tentar de novo
      return response.status(200).json({ paid: false });
    }

  } catch (error) {
    console.error("Erro ao verificar status no Mercado Pago:", error);
    return response.status(500).json({ error: 'Falha ao verificar o status do pagamento.' });
  }
}
