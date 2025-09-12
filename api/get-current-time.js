/**
 * FICHEIRO: /api/get-current-time.js
 *
 * DESCRIÇÃO:
 * Este endpoint simples e seguro retorna a hora atual do servidor no formato de timestamp.
 * Ele serve como uma fonte de tempo confiável para o frontend, prevenindo
 * que a data de expiração do acesso seja calculada com base no relógio do
 * dispositivo do usuário, que pode ser facilmente manipulado.
 */
export default function handler(req, res) {
    // Retorna a hora atual do servidor como um objeto JSON.
    // Date.now() fornece o número de milissegundos desde o Unix Epoch (a fonte de tempo confiável).
    res.status(200).json({ now: Date.now() });
}

