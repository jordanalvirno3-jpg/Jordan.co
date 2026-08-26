// api/create-checkout.js - Secure Yoco Checkout - FIXED
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Accept any field name your frontend uses
    const body = req.body || {};
    const total = body.total || body.amount || body.grandTotal || body.cartTotal || body.totalAmount || body.Total;
    const customer = body.customer || body.customerDetails || { email: body.email, name: body.name };
    const items = body.items || body.cart || [];

    if (!total) {
      return res.status(400).json({ error: `Missing total. Got: ${JSON.stringify(Object.keys(body))}` });
    }

    const secret = process.env.YOCO_SECRET_KEY;
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
        }
      })
    });

    const data = await yocoRes.json();

    if (!yocoRes.ok) {
      return res.status(400).json({ error: data.message || 'Yoco failed', details: data });
    }

    const redirectUrl = data.redirectUrl || data.redirect_url;
    return res.status(200).json({ redirectUrl, url: redirectUrl });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
