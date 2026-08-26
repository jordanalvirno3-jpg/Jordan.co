export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.YOCO_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'YOCO_SECRET_KEY not set in Vercel' });
  const { amount, currency, successUrl, cancelUrl, failureUrl, metadata } = req.body;
  try {
    const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ amount, currency: currency || 'ZAR', successUrl, cancelUrl, failureUrl, metadata })
    });
    const data = await yocoRes.json();
    if (!yocoRes.ok) return res.status(yocoRes.status).json(data);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}