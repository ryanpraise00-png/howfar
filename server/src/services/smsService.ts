// Africa's Talking has no bundled types — minimal declaration here
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AfricasTalking = require('africastalking') as (opts: { apiKey: string; username: string }) => {
  SMS: {
    send(opts: {
      to: string[];
      message: string;
      from?: string;
      enqueue?: boolean;
    }): Promise<{
      SMSMessageData: {
        Recipients: Array<{
          number: string;
          status: string;
          statusCode: number;
          cost: string;
          messageId: string;
        }>;
        Message: string;
      };
    }>;
  };
};

import { redis } from '../lib/redis';

// ── SDK singleton ──────────────────────────────────────────────────────────────

let _sms: ReturnType<typeof AfricasTalking>['SMS'] | null = null;

function getSms() {
  if (!_sms) {
    const apiKey   = process.env.AT_API_KEY ?? '';
    const username = process.env.AT_USERNAME ?? 'sandbox';
    _sms = AfricasTalking({ apiKey, username }).SMS;
  }
  return _sms;
}

// ── Redis key helpers ─────────────────────────────────────────────────────────

const SMS_FAIL_KEY    = (phone: string) => `sms_fail:${phone}`;
const SMS_FAIL_WINDOW = 600;  // 10 minutes
const MAX_SMS_FAILS   = 3;

// ── sendOtp ───────────────────────────────────────────────────────────────────

export async function sendOtp(
  phone: string,
  otp: string,
): Promise<{ ok: true } | { ok: false; code: 'SMS_DELIVERY_FAILED' | 'SMS_ERROR'; message: string }> {
  // Check consecutive delivery failures — if >= MAX, surface "Call me instead"
  const failCount = parseInt((await redis.get(SMS_FAIL_KEY(phone))) ?? '0', 10);
  if (failCount >= MAX_SMS_FAILS) {
    const ttl = await redis.ttl(SMS_FAIL_KEY(phone));
    return {
      ok: false,
      code: 'SMS_DELIVERY_FAILED',
      message: `We're having trouble sending SMS to this number. Try again in ${Math.ceil(ttl / 60)} minutes or contact support.`,
    };
  }

  const message =
    `Your HowFar verification code is: ${otp}. ` +
    `Valid for 5 minutes. Do not share this code.`;

  try {
    const params: Parameters<ReturnType<typeof AfricasTalking>['SMS']['send']>[0] = {
      to: [phone],
      message,
    };
    if (process.env.AT_SENDER_ID) {
      params.from = process.env.AT_SENDER_ID;
    }

    const response = await getSms().send(params);
    const recipient = response.SMSMessageData.Recipients[0];

    if (!recipient) {
      throw new Error('No recipient in AT response');
    }

    // AT success statuses
    const success = recipient.status === 'Success' ||
      recipient.statusCode === 101;   // 101 = sent

    if (!success) {
      throw new Error(`AT delivery failed: ${recipient.status}`);
    }

    // Clear any previous failure streak on success
    await redis.del(SMS_FAIL_KEY(phone));
    return { ok: true };

  } catch (err: any) {
    // Increment failure counter (with TTL on first failure)
    const newCount = await redis.incr(SMS_FAIL_KEY(phone));
    if (newCount === 1) await redis.expire(SMS_FAIL_KEY(phone), SMS_FAIL_WINDOW);

    if (newCount >= MAX_SMS_FAILS) {
      return {
        ok: false,
        code: 'SMS_DELIVERY_FAILED',
        message: `SMS delivery failed ${MAX_SMS_FAILS} times. Please contact support or try again later.`,
      };
    }

    return {
      ok: false,
      code: 'SMS_ERROR',
      message: err?.message ?? 'Failed to send OTP',
    };
  }
}
