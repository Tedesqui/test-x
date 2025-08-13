// Exemplo de backend em Node.js (/api/create-payment)

// ... (seu código de inicialização do express e do mercadopago) ...

app.post("/api/create-payment", async (req, res) => {
    
    // Pega a sessionId que o frontend enviou
    const { sessionId } = req.body;

    try {
        const preferenceData = {
            // ✅ 1. PROPÓSITO: Essencial para garantir que é um pagamento padrão.
            purpose: 'wallet_purchase', 
            
            items: [
                {
                    // ✅ 2. TÍTULO E QUANTIDADE: Obrigatórios.
                    title: 'Acesso por 1 hora à Ferramenta de IA',
                    quantity: 1,

                    // ✅ 3. PREÇO: DEVE ser um NÚMERO (não string) e maior que zero.
                    unit_price: 1.00, 
                    
                    currency_id: 'BRL' // Moeda
                }
            ],
            
            // ✅ 4. PAYER (PAGADOR): Altamente recomendado. Adicionar um email de teste 
            //    aumenta muito a chance de sucesso e resolve muitas falhas silenciosas.
            payer: {
                email: 'test_user_123456@testuser.com' 
            },

            // ✅ 5. REFERÊNCIA EXTERNA: Crucial para você saber qual pagamento 
            //    corresponde a qual sessão de usuário no seu sistema.
            external_reference: sessionId, 
        };

        const preference = await mercadopago.preferences.create(preferenceData);

        console.log("Preferência criada com sucesso. ID:", preference.body.id);

        // ✅ 6. RESPOSTA CORRETA: Envia APENAS o ID da preferência de volta para o frontend.
        return res.status(201).json({
            preferenceId: preference.body.id
        });

    } catch (error) {
        console.error("ERRO AO CRIAR PREFERÊNCIA:", error);
        return res.status(500).json({ message: "Falha ao criar preferência de pagamento." });
    }
});
