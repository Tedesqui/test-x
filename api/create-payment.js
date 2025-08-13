// /api/create-payment.js

import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken });
const preference = new Preference(client);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Pega tanto a sessionId quanto o payerEmail do corpo da requisição
    const { sessionId, payerEmail } = req.body;

    // Validação
    if (!sessionId || !payerEmail) {
      return res.status(400).json({ message: "sessionId e payerEmail são obrigatórios." });
    }

    const preferenceData = {
      body: {
        purpose: 'wallet_purchase',
        items: [
          {
            title: 'Acesso por 1 hora à Ferramenta de Correção',
            quantity: 1,
            unit_price: 1.00,
            currency_id: 'BRL',
          }
        ],
        // USA O E-MAIL RECEBIDO DO FRONTEND
        payer: {
          email: payerEmail, 
        },
        external_reference: sessionId,
      }
    };

    const result = await preference.create(preferenceData);
    
    return res.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("ERRO AO CRIAR PREFERÊNCIA:", error);
    const errorMessage = error.cause?.[0]?.description || error.message || "Falha ao criar preferência de pagamento.";
    return res.status(500).json({ message: errorMessage });
  }
}
