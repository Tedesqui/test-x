// /api/create-payment.js

import { MercadoPagoConfig, Preference } from 'mercadopago';

// Pega o token das Variáveis de Ambiente da Vercel
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN não foi definido.");
}

const client = new MercadoPagoConfig({ accessToken });
const preference = new Preference(client);

// A função principal que a Vercel irá executar
export default async function handler(req, res) {
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
        // O objeto 'payer' foi completamente removido para evitar o conflito
        // entre credenciais de produção e usuário de teste.
        external_reference: sessionId,
      }
    };

    const result = await preference.create(preferenceData);
    
    return res.status(201).json({ preferenceId: result.id });

  } catch (error) {
    console.error("ERRO AO CRIAR PREFERÊNCIA:", error);
    // Transforma o erro do MP em uma resposta mais clara, se possível
    const errorMessage = error.cause?.[0]?.description || error.message || "Falha ao criar preferência de pagamento.";
    return res.status(500).json({ message: errorMessage });
  }
}
