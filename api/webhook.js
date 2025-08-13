import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // Apenas aceita requisições POST do Mercado Pago
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { body } = req;

  // Verifica se a notificação é do tipo 'payment' e se possui um ID
  if (body.type === 'payment' && body.data && body.data.id) {
    const paymentId = body.data.id;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    console.log(`🔔 Webhook recebido para o pagamento: ${paymentId}`);

    try {
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      
      // Busca os detalhes completos do pagamento
      const paymentDetails = await payment.get({ id: paymentId });
      
      console.log(`Status do pagamento [${paymentId}]: ${paymentDetails.status}`);
      console.log(`Referência externa: ${paymentDetails.external_reference}`);

      // AQUI VOCÊ PODERIA ADICIONAR UMA LÓGICA DE BANCO DE DADOS
      // Ex: Se paymentDetails.status === 'approved', salvar no seu banco que
      // a sessão com external_reference foi paga.
      // Como não estamos usando um banco, o webhook serve principalmente para log e depuração.

    } catch (error) {
      console.error(`❌ Erro ao processar webhook para o pagamento ${paymentId}:`, error);
      // Retorna 200 mesmo em caso de erro para evitar que o Mercado Pago reenvie a notificação indefinidamente.
      return res.status(200).send('OK'); 
    }
  }

  // Responde ao Mercado Pago com 200 para confirmar o recebimento
  res.status(200).send('OK');
}
