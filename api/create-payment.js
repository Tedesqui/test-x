// /api/create-payment.js

import { MercadoPagoConfig, Preference } from 'mercadopago';

// Adicione suas credenciais do Mercado Pago diretamente no Vercel
// Vá em: Seu Projeto > Settings > Environment Variables
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN não foi definido nas variáveis de ambiente.");
}

const client = new MercadoPagoConfig({ accessToken });
const preference = new Preference(client);

// A função principal que a Vercel irá executar
export default async function handler(req, res) {
  // Garante que a requisição seja do tipo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId é obrigatório." });
    }

    const preferenceData = {
      body: {
        purpose: 'wallet_purchase',
        items: [
          {
            title: 'Acesso por 1 hora à Ferramenta de IA',
            quantity: 1,
            unit_price: 1.00,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: 'test_user_123456@testuser.com', // Email de teste recomendado
        },
        external_reference: sessionId,
      }
    };

    const result = await preference.create(preferenceData);

    // Retorna APENAS o ID da preferência
    return res.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("ERRO AO CRIAR PREFERÊNCIA:", error);
    return res.status(500).json({ message: "Falha ao criar preferência de pagamento." });
  }
}
