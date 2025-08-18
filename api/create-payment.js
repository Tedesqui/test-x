// Importa a biblioteca do Stripe e a inicializa com a sua chave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { sessionId, email, currency } = request.body || {};

        if (!sessionId || !email || !currency) {
            return response.status(400).json({ error: 'Dados insuficientes na requisição.' });
        }

        const successUrl = `https://${request.headers.host}?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `https://${request.headers.host}`;

        let lineItem;
        
        // A variável para as formas de pagamento agora é fixa
        const paymentMethodTypes = ['card'];

        // Define o item de compra com base na moeda
        if (currency === 'BRL') {
            lineItem = {
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: 'Acesso Semanal - Corretor IA',
                        description: 'Acesso por 1 semana à ferramenta de correção de provas com IA.',
                    },
                    unit_amount: 1490, // R$ 14,90 em centavos
                },
                quantity: 1,
            };
        } else {
            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Weekly Access - AI Proofreader',
                        description: '1-week access to the AI proofreader tool.',
                    },
                    unit_amount: 300, // $3.00 em centavos
                },
                quantity: 1,
            };
        }

        // Cria a Sessão de Checkout no Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethodTypes, // Sempre será apenas ['card']
            line_items: [lineItem],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: email,
            metadata: {
                internal_session_id: sessionId
            }
        });

        // Retorna a URL do checkout para o frontend
        return response.status(200).json({ checkoutUrl: session.url });

    } catch (error) {
        console.error("Erro ao criar sessão de checkout no Stripe:", error);
        return response.status(500).json({
            error: "Ocorreu um erro interno no servidor.",
            details: error.message
        });
    }
}
