// Arquivo: /api/create-payment.js

import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  // 1. Inicialize o cliente do Mercado Pago com seu Access Token de Produção
  //    (Certifique-se que a variável de ambiente MP_ACCESS_TOKEN está configurada no seu servidor)
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
  });
  const preference = new Preference(client);

  try {
    const body = {
      items: [
        {
          id: 'access-time-1h',
          title: 'Acesso de 1 hora ao App de Correção',
          quantity: 1,
          unit_price: 1.00, // O valor está correto (R$ 1,00)
          currency_id: 'BRL'
        }
      ],
      // ✅ ADICIONADO: ID da sua conta de vendedor.
      // Substitua o placeholder abaixo pelo seu número real.
      collector_id: DGBDCHEFA55037,

      // ✅ ADICIONADO: URLs para redirecionar o cliente após o pagamento.
      // Altere 'https://seusite.com.br' para o seu domínio real.
      back_urls: {
        success: 'https://https://prova-projeto.vercel.app/index.html?status=success', // Leva para a página do app
        failure: 'https://prova-projeto.vercel.app/index.html?status=failure', // Leva de volta para o pagamento
        pending: 'https://prova-projeto.vercel.app/index.html?status=pending'  // Leva de volta para o pagamento
      },
      auto_return: 'approved', // Redireciona automaticamente em caso de sucesso.

      // ✅ RECOMENDADO: URL para notificações do servidor (Webhook/IPN).
      // Isso permite que o Mercado Pago avise seu servidor sobre mudanças de status.
      // notification_url: 'https://seusite.com.br/api/webhook'
    };

    const result = await preference.create({ body });
    
    // Retorna o ID da preferência para o frontend
    res.status(200).json({ preferenceId: result.id });

  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    res.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
  }
}
