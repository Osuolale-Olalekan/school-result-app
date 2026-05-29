const WHATSAPP_API_URL = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TEMPLATE_NAME = "school_notification_utility";

// ── Normalize a Nigerian phone number to international format ────────────────
export function normalizePhone(raw: string): string {
  return raw
    .replace(/\s+/g, "")
    .replace(/^\+/, "")
    .replace(/^0/, "234");
}

// ── Extract all phone numbers from a field (handles "08012345678 07012345678")
export function extractPhones(phone: string): string[] {
  return phone
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(normalizePhone)
    .filter((p) => p.length >= 10);
}

// ── Send a single WhatsApp message ───────────────────────────────────────────
export async function sendWhatsAppMessage(
  phone: string,
  recipientName: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: recipientName },
                { type: "text", text: message },
              ],
            },
          ],
        },
      }),
    });

    const json = (await res.json()) as { error?: { message: string }; messages?: unknown; contacts?: unknown };

if (!res.ok) {
  return { success: false, error: json.error?.message ?? "Unknown error" };
}
return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ── Send to all phone numbers extracted from a field ─────────────────────────
export async function sendToAllPhones(
  phoneField: string,
  recipientName: string,
  message: string,
): Promise<{ sent: number; failed: number }> {
  const phones = extractPhones(phoneField);
  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    const result = await sendWhatsAppMessage(phone, recipientName, message);
    if (result.success) sent++;
    else failed++;
    await new Promise((r) => setTimeout(r, 200));
  }

  return { sent, failed };
}