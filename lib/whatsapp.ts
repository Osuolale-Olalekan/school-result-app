// const WHATSAPP_API_URL = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const TEMPLATE_NAME = "school_notification_utility";

// // ── Normalize a Nigerian phone number to international format ────────────────
// export function normalizePhone(raw: string): string {
//   return raw
//     .replace(/\s+/g, "")
//     .replace(/^\+/, "")
//     .replace(/^0/, "234");
// }

// // ── Extract all phone numbers from a field (handles "08012345678 07012345678")
// export function extractPhones(phone: string): string[] {
//   return phone
//     .split(/[\s,;]+/)
//     .map((p) => p.trim())
//     .filter(Boolean)
//     .map(normalizePhone)
//     .filter((p) => p.length >= 10);
// }

// // ── Send a single WhatsApp message ───────────────────────────────────────────
// export async function sendWhatsAppMessage(
//   phone: string,
//   recipientName: string,
//   message: string,
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const res = await fetch(WHATSAPP_API_URL, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${ACCESS_TOKEN}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         messaging_product: "whatsapp",
//         to: phone,
//         type: "template",
//         template: {
//           name: TEMPLATE_NAME,
//           language: { code: "en" },
//           components: [
//             {
//               type: "body",
//               parameters: [
//                 { type: "text", text: recipientName },
//                 { type: "text", text: message },
//               ],
//             },
//           ],
//         },
//       }),
//     });

//     const json = (await res.json()) as { error?: { message: string }; messages?: unknown; contacts?: unknown };

// if (!res.ok) {
//   return { success: false, error: json.error?.message ?? "Unknown error" };
// }
// return { success: true };
//   } catch (err) {
//     return {
//       success: false,
//       error: err instanceof Error ? err.message : "Network error",
//     };
//   }
// }

// // ── Send to all phone numbers extracted from a field ─────────────────────────
// export async function sendToAllPhones(
//   phoneField: string,
//   recipientName: string,
//   message: string,
// ): Promise<{ sent: number; failed: number }> {
//   const phones = extractPhones(phoneField);
//   let sent = 0;
//   let failed = 0;

//   for (const phone of phones) {
//     const result = await sendWhatsAppMessage(phone, recipientName, message);
//     if (result.success) sent++;
//     else failed++;
//     await new Promise((r) => setTimeout(r, 200));
//   }

//   return { sent, failed };
// }


// lib/whatsapp.ts

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v25.0";
const TEMPLATE_NAME =
  process.env.WHATSAPP_TEMPLATE_NAME ?? "school_notification_utility";
const TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG ?? "en";

function apiUrl(): string {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

// ── Normalize a Nigerian phone number to international format (234...) ───────
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, ""); // drop +, spaces, dashes, brackets

  if (digits.startsWith("2340")) {
    digits = "234" + digits.slice(4); // 2340801... -> 234801...
  } else if (digits.startsWith("0")) {
    digits = "234" + digits.slice(1); // 0801... -> 234801...
  } else if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = "234" + digits; // 801... -> 234801...
  }
  return digits;
}

// ── Extract all phone numbers from a field (handles "08012345678 07012345678")
export function extractPhones(phone: string): string[] {
  return phone
    .split(/[\s,;/]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(normalizePhone)
    .filter((p) => p.length >= 12 && p.length <= 13); // 234 + 10 digits
}

// WhatsApp template variables cannot contain new lines, tabs or 4+ spaces
function cleanForTemplate(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 1000);
}

export interface WhatsAppSendResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// ── Send a single WhatsApp template message ──────────────────────────────────
export async function sendWhatsAppMessage(
  phone: string,
  recipientName: string,
  message: string,
): Promise<WhatsAppSendResult> {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, error: "WhatsApp is not configured" };
  }

  try {
    const res = await fetch(apiUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: TEMPLATE_LANG },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: cleanForTemplate(recipientName) || "Parent" },
                { type: "text", text: cleanForTemplate(message) },
              ],
            },
          ],
        },
      }),
    });

    const json = (await res.json()) as {
      error?: { message?: string; code?: number; error_data?: { details?: string } };
      messages?: Array<{ id: string; message_status?: string }>;
    };

    if (!res.ok || json.error) {
      console.error("[WhatsApp] send failed", phone, JSON.stringify(json));
      const code = json.error?.code ? ` (code ${json.error.code})` : "";
      const details = json.error?.error_data?.details
        ? ` - ${json.error.error_data.details}`
        : "";
      return {
        success: false,
        error: `${json.error?.message ?? "Unknown error"}${code}${details}`,
      };
    }

    const id = json.messages?.[0]?.id;
    console.log(
      "[WhatsApp] accepted",
      phone,
      id,
      json.messages?.[0]?.message_status ?? "",
    );
    return { success: true, messageId: id };
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