/*
 * FICHEIRO: /api/read-text-aws.js (MODIFICADO PARA USAR MATHPIX)
 *
 * DESCRIÇÃO:
 * Este endpoint recebe a imagem do frontend, envia-a para a API da Mathpix
 * para um reconhecimento preciso de texto e equações (em LaTeX), e
 * devolve o texto extraído e formatado.
 */

import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
        }

        const appId = process.env.MATHPIX_APP_ID;
        const appKey = process.env.MATHPIX_APP_KEY;

        if (!appId || !appKey) {
            return res.status(500).json({ error: 'Credenciais da API Mathpix não configuradas.' });
        }

        const response = await axios.post('https://api.mathpix.com/v3/text', 
            {
                src: image,
                formats: ['text'] 
            },
            {
                headers: {
                    'app_id': appId,
                    'app_key': appKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const extractedText = response.data.text || '';
        
        res.status(200).json({ text: extractedText });

    } catch (error) {
        console.error('Erro ao processar com a Mathpix:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Falha ao analisar a imagem.' });
    }
}
