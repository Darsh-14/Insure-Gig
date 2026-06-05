/**
 * InsureGig SMS Gateway — Cloudflare Worker
 * Proxies Twilio SMS calls server-side so credentials never reach the browser.
 * Deploy: cd sms-gateway && npx wrangler deploy
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function sendTwilioSms(to, message, env) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = env;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const body = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: message });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Twilio API error');
  return data;
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method !== 'POST' || url.pathname !== '/api/sms/send') {
      return json({ ok: false, error: 'Not found' }, 404);
    }

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
      return json({ ok: false, error: 'Twilio secrets not configured in Worker environment.' }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON body.' }, 400);
    }

    const to = String(payload?.to || '').trim();
    const message = String(payload?.message || '').trim();

    if (!to || !message) {
      return json({ ok: false, error: 'Fields "to" and "message" are required.' }, 400);
    }

    try {
      const result = await sendTwilioSms(to, message, env);
      return json({ ok: true, sid: result.sid, status: result.status, to: result.to });
    } catch (err) {
      return json({ ok: false, error: err instanceof Error ? err.message : 'SMS send failed' }, 500);
    }
  },
};
