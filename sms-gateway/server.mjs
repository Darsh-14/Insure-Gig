import http from 'node:http';

const port = Number(process.env.SMS_GATEWAY_PORT || 8787);
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(payload));
}

async function sendTwilioSms(to, body) {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const encoded = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encoded.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Twilio API call failed');
  }
  return data;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/sms/send') {
    sendJson(res, 404, { ok: false, error: 'Not found' });
    return;
  }

  if (!accountSid || !authToken || !fromNumber) {
    sendJson(res, 500, {
      ok: false,
      error: 'Missing Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).',
    });
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const payload = JSON.parse(raw || '{}');
    const to = String(payload?.to || '').trim();
    const message = String(payload?.message || '').trim();

    if (!to || !message) {
      sendJson(res, 400, { ok: false, error: 'Fields "to" and "message" are required.' });
      return;
    }

    const result = await sendTwilioSms(to, message);
    sendJson(res, 200, {
      ok: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'SMS send failed' });
  }
});

server.listen(port, () => {
  console.log(`[sms-gateway] listening on http://localhost:${port}`);
});

