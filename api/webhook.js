export default async function handler(req, res) {
  // Mercado Pago will post notifications here. For production you should validate signatures, and update DB.
  console.log('Webhook payload:', req.body);
  // Example: when notification comes you can fetch the payment and mark session paid in DB.
  res.status(200).send('OK');
}
