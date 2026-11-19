import crypto from 'crypto';

let cachedToken: { token: string; expiresAt: number; cacheKey: string } | null = null;

export function isFakeMpesa(): boolean {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
  const fakeEnv = process.env.MPESA_FAKE;
  if (fakeEnv !== undefined && fakeEnv !== '') {
    return fakeEnv === 'true' || fakeEnv === '1';
  }
  return consumerKey === '';
}

export function normalizePhone(phone?: string | null): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  let normalized = digits;
  const m0 = digits.match(/^0([17]\d{8})$/);
  const m9 = digits.match(/^([17]\d{8})$/);
  if (m0) {
    normalized = `254${m0[1]}`;
  } else if (m9) {
    normalized = `254${m9[1]}`;
  }
  return /^254[17]\d{8}$/.test(normalized) ? normalized : null;
}

export function callbackToken(): string {
  if (process.env.MPESA_CALLBACK_TOKEN) {
    return process.env.MPESA_CALLBACK_TOKEN;
  }
  const secret = process.env.APP_SECRET || 'jersey-league-kenya-default-secret-key';
  return crypto.createHmac('sha256', secret).update('mpesa-callback').digest('hex').slice(0, 40);
}

export function callbackUrl(): string {
  const base = (process.env.MPESA_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/+$/,
    ''
  );
  return `${base}/api/mpesa/callback/${callbackToken()}`;
}

function baseUrl(): string {
  return process.env.MPESA_ENV === 'live'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

function nairobiTimestamp(): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

function darajaPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const passkey = process.env.MPESA_PASSKEY || '';
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const env = process.env.MPESA_ENV || 'sandbox';
  const cacheKey = `${env}:${shortcode}:${consumerKey.slice(0, 8)}`;

  if (cachedToken && cachedToken.cacheKey === cacheKey && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('M-Pesa connection error while requesting token:', err);
    throw new Error('We could not reach M-Pesa. Please try again in a moment.');
  }

  if (!res.ok) {
    console.error(`M-Pesa token request failed (${res.status}):`, await res.text());
    throw new Error('M-Pesa is not available right now. Please try again later.');
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('M-Pesa is not available right now. Please try again later.');
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
    cacheKey,
  };

  return data.access_token;
}

export async function stkPush(
  phone: string,
  amount: number,
  reference: string,
  description: string
): Promise<{ merchantRequestId: string; checkoutRequestId: string }> {
  if (isFakeMpesa()) {
    const rand = (len: number) => crypto.randomBytes(len).toString('hex').slice(0, len).toUpperCase();
    return {
      merchantRequestId: `FAKE-${rand(10)}`,
      checkoutRequestId: `ws_CO_FAKE_${rand(16)}`,
    };
  }

  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const partyB = process.env.MPESA_PARTY_B || shortcode;
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline';
  const timestamp = nairobiTimestamp();
  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: darajaPassword(timestamp),
        Timestamp: timestamp,
        TransactionType: transactionType,
        Amount: amount,
        PartyA: phone,
        PartyB: partyB,
        PhoneNumber: phone,
        CallBackURL: callbackUrl(),
        AccountReference: reference.slice(0, 12),
        TransactionDesc: description.slice(0, 13),
      }),
      cache: 'no-store',
    });
  } catch (err) {
    console.error('M-Pesa connection error during stkPush:', err);
    throw new Error('We could not reach M-Pesa. Please try again in a moment.');
  }

  if (!res.ok) {
    console.error(`M-Pesa answered ${res.status}:`, await res.text());
    throw new Error('M-Pesa could not start the payment. Please try again in a moment.');
  }

  const data = (await res.json()) as {
    ResponseCode?: string;
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
  };

  if (data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    console.error('M-Pesa refused the request:', data);
    throw new Error('M-Pesa could not start the payment. Please check the number and try again.');
  }

  return {
    merchantRequestId: String(data.MerchantRequestID),
    checkoutRequestId: String(data.CheckoutRequestID),
  };
}

export interface StkCallbackPayload {
  MerchantRequestID?: string | null;
  CheckoutRequestID?: string;
  ResultCode?: number | string;
  ResultDesc?: string;
  CallbackMetadata?: {
    Item?: Array<{ Name?: string; Value?: string | number | null }>;
  };
}

export async function stkQuery(checkoutRequestId: string): Promise<StkCallbackPayload | null> {
  if (isFakeMpesa()) {
    return null;
  }

  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const timestamp = nairobiTimestamp();
  try {
    const token = await getAccessToken();
    const res = await fetch(`${baseUrl()}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: darajaPassword(timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
      cache: 'no-store',
    });

    const data = (await res.json()) as Record<string, unknown>;
    // ResultCode 4999 or errorCode 500.001.1001 means "The transaction is still under processing"
    if (!data || data.ResultCode === undefined || Number(data.ResultCode) === 4999) {
      return null;
    }

    return {
      MerchantRequestID: (data.MerchantRequestID as string) ?? null,
      CheckoutRequestID: checkoutRequestId,
      ResultCode: Number(data.ResultCode),
      ResultDesc: String(data.ResultDesc ?? ''),
    };
  } catch {
    return null;
  }
}
