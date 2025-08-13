import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken });
const preference = new Preference(client);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    // Agora espera 'paymentAttemptId'
    const { paymentAttemptId, payerEmail } = req.body;
    if (!paymentAttemptId || !payerEmail) {
      return res.status(400).json({ message: "paymentAttemptId e payerEmail são obrigatórios." });
    }

    const preferenceData = {
      body: {
        items: [{ title: 'Acesso por 1 hora', quantity: 1, unit_price: 1.00, currency_id: 'BRL' }],
        payer: { email: payerEmail },
        // Usa o novo ID como referência externa
        external_reference: paymentAttemptId,
      }
    };

    const result = await preference.create(preferenceData);
    return res.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("ERRO AO CRIAR PREFERÊNCIA:", error);
    return res.status(500).json({ message: error.cause?.message || error.message });
  }
}
