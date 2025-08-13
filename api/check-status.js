// /api/check-status.js

import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN não foi definido nas variáveis de ambiente.");
}

const client = new MercadoPagoConfig({ accessToken });
const payment = new Payment(client);

// A função principal que a Vercel irá executar
export default async function handler(req, res) {
  // Garante que a requisição seja do tipo GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ message: "O parâmetro sessionId é obrigatório." });
    }

    const paymentSearch = await payment.search({
      options: {
        external_reference: sessionId,
        sort: 'date_created',
        criteria: 'desc',
      },
    });

    const payments = paymentSearch.results;

    if (payments && payments.length > 0) {
      const latestPayment = payments[0];
      if (latestPayment.status === 'approved') {
        return res.status(200).json({ paid: true });
      }
    }

    return res.status(200).json({ paid: false });

  } catch (error) {
    console.error("ERRO AO VERIFICAR STATUS:", error);
    return res.status(500).json({ message: "Erro interno ao verificar status do pagamento." });
  }
}
