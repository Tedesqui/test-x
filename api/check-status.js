import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken });
const payment = new Payment(client);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  try {
    // Agora espera 'paymentAttemptId' na URL
    const { paymentAttemptId } = req.query;
    if (!paymentAttemptId) {
      return res.status(400).json({ message: "O parâmetro paymentAttemptId é obrigatório." });
    }

    const paymentSearch = await payment.search({
      options: {
        external_reference: paymentAttemptId, // Busca pelo novo ID
        sort: 'date_created',
        criteria: 'desc',
      },
    });

    const payments = paymentSearch.results;

    if (payments && payments.length > 0) {
      if (payments[0].status === 'approved') {
        return res.status(200).json({ paid: true });
      }
    }
    return res.status(200).json({ paid: false });

  } catch (error) {
    console.error("ERRO AO VERIFICAR STATUS:", error);
    return res.status(500).json({ message: "Erro interno ao verificar status." });
  }
}
