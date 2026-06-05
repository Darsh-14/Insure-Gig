// Priority: VITE_SMS_API_URL env var → deployed Cloudflare Worker → local dev server
const SMS_ENDPOINT =
  import.meta.env.VITE_SMS_API_URL ||
  import.meta.env.VITE_SMS_WORKER_URL ||
  'http://localhost:8787/api/sms/send';

export interface SmsResult {
  ok: boolean;
  sid?: string;
  status?: string;
  to?: string;
  error?: string;
}

export async function sendPayoutSms(to: string, message: string): Promise<SmsResult> {
  try {
    const response = await fetch(SMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    const data = (await response.json()) as SmsResult;
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to send SMS' };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}
