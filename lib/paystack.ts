// lib/paystack.ts
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = "https://api.paystack.co";

export async function initializePaystackPayment(data: {
  email: string;
  amount: number; // in kobo (multiply naira by 100)
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      amount: data.amount,
      reference: data.reference,
      metadata: data.metadata,
    }),
  });

  const json = await res.json() as {
    status: boolean;
    message?: string;
    data: { authorization_url: string; access_code: string; reference: string };
  };

  // if (!json.status) throw new Error("Failed to initialize Paystack payment");
  if (!json.status) throw new Error(`Paystack error: ${json.message}`);
  return json.data;
}

export async function verifyPaystackPayment(reference: string): Promise<{
  status: string; // "success" | "failed" | "abandoned"
  amount: number; // in kobo
  customer: { email: string };
  metadata: Record<string, unknown>;
}> {
  const res = await fetch(`${BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const json = await res.json() as {
    status: boolean;
    data: {
      status: string;
      amount: number;
      customer: { email: string };
      metadata: Record<string, unknown>;
    };
  };

  if (!json.status) throw new Error("Failed to verify Paystack payment");
  return json.data;
}

export function generatePaymentReference(studentId: string, termId: string): string {
  return `GWMGS-${studentId.slice(-6)}-${termId.slice(-6)}-${Date.now()}`;
}