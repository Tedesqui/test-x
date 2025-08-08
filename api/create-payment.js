// Exemplo de como seu arquivo /api/create-payment.js deve se parecer

import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  // Inicialize o cliente do Mercado Pago com seu Access Token
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
  });
  const preference = new Preference(client);

  try {
    const body = {
      items: [
        {
          id: 'access-time',
          title: 'Acesso de 1 hora ao App',
          quantity: 1,
          unit_price: 0.00 // <-- ALTERE O VALOR REAL AQUI
        }
      ],
      // Outras configurações como back_urls, etc.
    };

    const result = await preference.create({ body });
    res.status(200).json({ preferenceId: result.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
}
