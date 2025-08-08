export default async function handler(req, res) {
    // Apenas permite pedidos POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Recebe o texto e o idioma do frontend
        const { texto, language } = req.body;
        if (!texto) {
            return res.status(400).json({ error: 'Nenhum texto fornecido.' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Chave de API da OpenAI não configurada.' });
        }
        
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        // Mapeamento de idiomas para instruções claras para a IA
        const languageMap = {
            'en': 'English',
            'es': 'Spanish',
            'pt': 'Brazilian Portuguese'
        };
        
        // Define o idioma da resposta, com 'pt' como padrão
        const targetLanguage = languageMap[language] || languageMap['pt'];

        const systemPrompt = `
            Você é um assistente de IA altamente inteligente e versátil. Sua principal função é analisar o texto do usuário e determinar a tarefa implícita para fornecer uma resposta direta e precisa.

            Siga estas regras para determinar a tarefa:
            1.  **Se o texto for uma equação matemática ou um problema para resolver (ex: "9 * 9 =", "calcule a área de um círculo com raio 5"),** resolva o problema e forneça apenas o resultado final, a menos que uma explicação seja solicitada.
            2.  **Se o texto for uma pergunta direta (ex: "Qual é a capital do Japão?"),** responda à pergunta de forma completa e precisa.
            3.  **Se o texto for uma afirmação a ser verificada (ex: "O sol gira em torno da Terra."),** analise sua veracidade, corrija-a se estiver incorreta e forneça uma breve explicação.
            4.  **Se o texto for uma frase para completar,** complete-a de forma lógica e coerente.

            Sempre priorize a resposta mais direta e útil para a tarefa que você identificou.
        `;

        const payload = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: texto }
            ],
            temperature: 0.3, // Mais preciso para correções
            max_tokens: 1000
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            throw new Error(errorBody.error.message || 'A API da OpenAI não conseguiu processar o pedido.');
        }

        const responseData = await apiResponse.json();
        const answer = responseData.choices[0].message.content;

        res.status(200).json({ resultado: answer });

    } catch (error) {
        console.error('Erro no endpoint de correção:', error);
        res.status(500).json({ error: 'Falha ao obter a correção. Tente novamente.' });
    }
}
