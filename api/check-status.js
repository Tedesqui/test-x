// /api/check-status.js
// NOTE QUE ESTE CÓDIGO CORRETO NÃO IMPORTA OU USA 'express'

import { MercadoPagoConfig, Payment } from 'mercadopago';

// Pega o token das Variáveis de Ambiente da Vercel
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

// Validação para garantir que a variável de ambiente foi configurada
if (!accessToken) {
  console.error("ERRO CRÍTICO: MERCADOPAGO_ACCESS_TOKEN não foi definido.");
}

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({ accessToken });
const payment = new Payment(client);

// A função handler que a Vercel executa
export default async function handler(req, res) {
  // Verifica se o método da requisição é GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Pega a sessionId da URL (ex: /api/check-status?sessionId=123)
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ message: "O parâmetro sessionId é obrigatório." });
    }

    // Busca o pagamento no Mercado Pago
    const paymentSearch = await payment.search({
      options: {
        external_reference: sessionId,
        sort: 'date_created',
        criteria: 'desc',
      },
    });

    const payments = paymentSearch.results;

    // Se encontrou pagamentos, verifica o mais recente
    if (payments && payments.length > 0) {
      const latestPayment = payments[0];
      if (latestPayment.status === 'approved') {
        return res.status(200).json({ paid: true });
      }
    }

    // Caso contrário, o pagamento não foi aprovado
    return res.status(200).json({ paid: false });

  } catch (error) {
    console.error("ERRO AO VERIFICAR STATUS:", error);
    return res.status(500).json({ message: "Erro interno ao verificar status do pagamento." });
  }
}
