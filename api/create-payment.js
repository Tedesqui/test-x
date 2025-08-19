// Importa a biblioteca do Stripe e a inicializa com a sua chave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const productDetails = {
    "pt-br": { name: 'Acesso Semanal - Corretor IA', description: 'Acesso por 1 semana à ferramenta de correção de provas com IA.' },
    "en": { name: 'Weekly Access - AI Proofreader', description: '1-week access to the AI proofreader tool.' },
    "es": { name: 'Acceso Semanal - Corrector IA', description: 'Acceso de 1 semana a la herramienta de corrección de pruebas con IA.' },
    "it": { name: 'Accesso Settimanale - Correttore AI', description: 'Accesso di 1 settimana allo strumento di correzione bozze con IA.' },
    "fr": { name: 'Accès Hebdomadaire - Correcteur IA', description: "Accès d'une semaine à l'outil de correction d'épreuves par IA." },
    "de": { name: 'Wöchentlicher Zugang - KI-Korrektor', description: '1 Woche Zugang zum KI-Korrekturlesetool.' },
    "ru": { name: 'Недельный доступ - ИИ-корректор', description: 'Доступ на 1 неделю к инструменту ИИ-корректора.' },
    "ja": { name: '週間アクセス - AI校正ツール', description: 'AI校正ツールへの1週間のアクセス。' },
    "ko": { name: '주간 액세스 - AI 교정기', description: 'AI 교정 도구에 대한 1주일 액세스.' },
    "zh": { name: '每周访问 - AI校对器', description: '为期1周的AI校对工具访问权限。' },
    "hi": { name: 'साप्ताहिक पहुंच - एआई प्रूफ़रीडर', description: 'एआई प्रूफ़रीडर टूल के लिए 1-सप्ताह का एक्सेस।' },
    "fil": { name: 'Lingguhang Access - AI Proofreader', description: '1-linggong access sa AI proofreader tool.' },
    "sv": { name: 'Veckovis Åtkomst - AI-korrekturläsare', description: '1 veckas åtkomst till AI-korrekturläsningsverktyget.' },
    "pl": { name: 'Dostęp Tygodniowy - Korektor AI', description: '1-tygodniowy dostęp do narzędzia korektora AI.' },
    "bn": { name: 'সাপ্তাহিক অ্যাক্সেস - এআই প্রুফরিডার', description: 'এআই প্রুফরিডার টুলে ১ সপ্তাহের অ্যাক্সেস।' },
    "ar": { name: 'وصول أسبوعي - مدقق لغوي بالذكاء الاصطناعي', description: 'وصول لمدة أسبوع واحد إلى أداة المدقق اللغوي بالذكاء الاصطناعي.' }
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { sessionId, email, currency, langCode } = request.body || {};
        const details = productDetails[langCode] || productDetails['en'];

        if (!sessionId || !email || !currency) {
            return response.status(400).json({ error: 'Dados insuficientes na requisição.' });
        }

        const successUrl = `https://${request.headers.host}?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `https://${request.headers.host}`;

        const lineItem = {
            price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                    name: details.name,
                    description: details.description,
                },
                unit_amount: currency.toLowerCase() === 'brl' ? 1490 : 300,
            },
            quantity: 1,
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItem],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: email,
            metadata: {
                internal_session_id: sessionId
            }
        });

        return response.status(200).json({ checkoutUrl: session.url });

    } catch (error) {
        console.error("Erro ao criar sessão de checkout no Stripe:", error);
        return response.status(500).json({
            error: "Ocorreu um erro interno no servidor.",
            details: error.message
        });
    }
}
