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

  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  try {
    // CORREÇÃO: Trocamos 'order' por 'criteria'
    const searchResult = await payment.search({
      options: {
        external_reference: sessionId,
        sort: 'date_created',
        criteria: 'desc' // Este é o nome correto do parâmetro
      }
    });

    if (searchResult.results && searchResult.results.length > 0) {
      const latestPayment = searchResult.results[0];
      
      console.log(`Status do pagamento [${latestPayment.id}] para sessionId [${sessionId}]: ${latestPayment.status}`);

      if (latestPayment.status === 'approved') {
        console.log(`✅ Pagamento APROVADO para sessionId: ${sessionId}. Liberando acesso.`);
        return response.status(200).json({ paid: true });
      }
    }

    // Se não encontrou ou não está aprovado, retorna 'paid: false'
    return response.status(200).json({ paid: false });

  } catch (error) {
    // Se a API do Mercado Pago retornar um erro, ele será logado aqui
    console.error("❌ Erro na API do Mercado Pago ao verificar status:", error);
    return response.status(500).json({ error: 'Falha ao verificar o status do pagamento.' });
  }
}
