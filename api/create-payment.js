import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const body = {
      items: [
        {
          title: "Acesso de 1 hora ao site",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 4.90
        }
      ],
      back_urls: {
        success: `${req.headers.origin}/?status=success`,
        failure: `${req.headers.origin}/?status=failure`,
        pending: `${req.headers.origin}/?status=pending`
      },
      auto_return: "approved",
      external_reference: sessionId
    };

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('MP error:', errText);
      return res.status(500).json({ error: 'Erro ao criar preference' });
    }
    const data = await resp.json();
    return res.status(200).json({ preferenceId: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
