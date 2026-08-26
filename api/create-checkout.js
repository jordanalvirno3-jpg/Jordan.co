// api/create-checkout.js - Secure Yoco Checkout (Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { total, customer, items } = req.body;

    if (!total) {
      return res.status(400).json({ error: 'Missing total' });
    }

    const secret = process.env.YOCO_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ error: 'YOCO_SECRET_KEY not set in Vercel' });
    }

    // Yoco expects amount in cents
    const amountInCents = Math.round(Number(total) * 100);

    const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'ZAR',
        successUrl: 'https://jordan-co.vercel.app/#success',
        cancelUrl: 'https://jordan-co.vercel.app/#collection',
        failureUrl: 'https://jordan-co.vercel.app/#collection',
        metadata: {
          customer_email: customer?.email || '',
          customer_name: customer?.name || '',
          items: JSON.stringify(items || []).slice(0, 400)
        }
      })
    });

    const data = await yocoRes.json();

    if (!yocoRes.ok) {
      console.error('Yoco error:', data);
      return res.status(400).json({ error: data.message || 'Yoco checkout failed', details: data });
    }

    // Yoco returns redirectUrl
    const redirectUrl = data.redirectUrl || data.redirect_url || data.url;
    
    return res.status(200).json({ redirectUrl, url: redirectUrl, id: data.id });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
