export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { texto, language } = req.body;
        if (!texto) {
            return res.status(400).json({ error: 'Nenhum texto fornecido.' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Chave de API da OpenAI não configurada.' });
        }
        
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        const languageMap = {
            'en': 'English', 'es': 'Spanish', 'pt': 'Brazilian Portuguese',
            'zh': 'Mandarin Chinese', 'ja': 'Japanese', 'ko': 'Korean',
            'it': 'Italian', 'de': 'German', 'fr': 'French', 'ru': 'Russian'
        };
        const targetLanguage = languageMap[language] || languageMap['pt'];

        // --- PROMPT ATUALIZADO PARA ENTENDER LATEX ---
        const systemPrompt = `
            Você é um assistente especialista em resolver questões acadêmicas. Sua tarefa é analisar o texto do usuário, que pode conter texto simples ou equações em formato LaTeX, e fornecer a resposta correta.

            Siga estas regras rigorosamente:
            1.  **Prioridade para LaTeX:** Se o texto contiver código LaTeX (geralmente entre \\( ... \\) ou $$ ... $$), sua principal tarefa é resolver a equação matemática. Forneça o resultado final. Se for um problema complexo, mostre os passos da resolução de forma clara.
            2.  **Questões de Múltipla Escolha:** Se for uma questão com alternativas (A, B, C, D), primeiro, resolva o problema ou responda à pergunta, e então, indique claramente qual alternativa é a correta.
            3.  **Perguntas Diretas:** Se for uma pergunta textual, responda de forma precisa e direta.
            4.  **Verificação de Fatos:** Se for uma afirmação, verifique sua veracidade e corrija-a se necessário, com uma breve explicação.

            IMPORTANTE: Sua resposta DEVE ser estritamente no idioma: ${targetLanguage}. Não use markdown na resposta final.
        `;

        const payload = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: texto }
            ],
            temperature: 0.2,
            max_tokens: 1500
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
