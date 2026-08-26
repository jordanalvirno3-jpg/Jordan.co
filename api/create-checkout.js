export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const total = body.total || body.amount || body.grandTotal || body.cartTotal || body.totalAmount;
    const customer = body.customer || {};
    const items = body.items || body.cart || [];

    if (!total) {
      return res.status(400).json({ error: 'Missing total' });
    }

    const secret = process.env.YOCO_SECRET_KEY;
    const numTotal = Number(total);
    
    // FIX FOR R32 000 BUG: if already in cents (32000) use it, if in rands (320) convert
    const amountInCents = numTotal > 1000 ? Math.round(numTotal) : Math.round(numTotal * 100);

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
          email: customer.email || '',
          name: customer.name || ''
        }
      })
    });

    const data = await yocoRes.json();

    if (!yocoRes.ok) {
      return res.status(400).json({ error: data.message || 'Yoco error', details: data });
    }

    return res.status(200).json({ 
      redirectUrl: data.redirectUrl || data.redirect_url,
      url: data.redirectUrl || data.redirect_url
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
