import fetch from 'node-fetch';

// Simple in-memory store for demo purposes.
// In production use a persistent DB to map sessionId -> paid
const paidSessions = global.paidSessions || (global.paidSessions = {});

export default async function handler(req, res) {
  // GET /api/check-status?sessionId=...
  const sessionId = req.query.sessionId || (req.body && req.body.sessionId);
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  // If already marked paid in-memory, return quickly
  if (paidSessions[sessionId]) return res.status(200).json({ paid: true });

  try {
    // Search payments by external_reference (sessionId)
    const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(sessionId)}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    if (!resp.ok) return res.status(500).json({ error: 'Erro ao consultar MP' });
    const data = await resp.json();
    // check results: if any payment with status 'approved' exists
    const results = (data.results || []);
    const approved = results.some(p => p.status === 'approved' || p.status === 'authorized');
    if (approved) {
      paidSessions[sessionId] = true; // mark paid
      return res.status(200).json({ paid: true });
    } else {
      return res.status(200).json({ paid: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
