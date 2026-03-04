import { Resend } from "resend";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

const SCHOOL = "God's Way Model Groups of Schools";
const IS_DEV = process.env.NODE_ENV !== "production";

// ─── Transport abstraction ─────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

async function getDevTransporter(): Promise<nodemailer.Transporter> {
  // If you have fixed Ethereal credentials in .env, use them.
  // Otherwise auto-generate a fresh test account.
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  console.log("─── Ethereal Test Account Created ───────────────────────────");
  console.log("  To reuse this account across restarts, add to your .env:");
  console.log(`  ETHEREAL_USER=${testAccount.user}`);
  console.log(`  ETHEREAL_PASS=${testAccount.pass}`);
  console.log("─────────────────────────────────────────────────────────────");

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  try {
    if (IS_DEV) {
      const transporter = await getDevTransporter();
      const info = await transporter.sendMail({
        from: `"${SCHOOL}" <no-reply@godswayschool.edu.ng>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
      } as Mail.Options);

      console.log("─── Email Sent (Development) ─────────────────────────────────");
      console.log(`  To:      ${Array.isArray(to) ? to.join(", ") : to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Preview: ${nodemailer.getTestMessageUrl(info)}`);
      console.log("──────────────────────────────────────────────────────────────");
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM ?? "noreply@godswayschool.edu.ng";
      await resend.emails.send({ from, to, subject, html });
    }
  } catch (error) {
    console.error("Email send error:", error);
    // don't rethrow — email failure shouldn't break the main operation
  }
}

// ─── Base Template ─────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${SCHOOL}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1e3a5f 0%,#0a1628 100%);padding:32px;text-align:center;">
            <h1 style="color:#f59e0b;font-size:20px;margin:0 0 4px;">${SCHOOL}</h1>
            <p style="color:#94a3b8;font-size:12px;margin:0;">Sowing the Seed of Merit and Excellence</p>
          </div>
          <div style="padding:32px;">
            ${content}
          </div>
          <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} ${SCHOOL}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ─── Email Templates ───────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  role: string,
  tempPassword: string
): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color:#1e3a5f;margin:0 0 16px;">Welcome to ${SCHOOL}!</h2>
    <p style="color:#374151;line-height:1.6;">Dear ${firstName},</p>
    <p style="color:#374151;line-height:1.6;">Your account has been created as <strong>${role}</strong>. Use the credentials below to sign in:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#374151;"><strong>Email:</strong> ${to}</p>
      <p style="margin:0;color:#374151;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
    </div>
    <p style="color:#ef4444;font-size:14px;">Please change your password immediately after your first login.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-in" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Sign In Now</a>
  `);
  await sendEmail({ to, subject: `Welcome to ${SCHOOL} - Account Created`, html });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color:#1e3a5f;margin:0 0 16px;">Password Reset Request</h2>
    <p style="color:#374151;line-height:1.6;">Dear ${firstName},</p>
    <p style="color:#374151;line-height:1.6;">You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:24px 0;">Reset Password</a>
    <p style="color:#6b7280;font-size:14px;">If you didn't request this, please ignore this email.</p>
  `);
  await sendEmail({ to, subject: "Password Reset - " + SCHOOL, html });
}

export async function sendReportAvailableEmail(
  to: string,
  parentName: string,
  studentName: string,
  sessionName: string,
  termName: string,
  dashboardUrl: string
): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color:#1e3a5f;margin:0 0 16px;">Report Card Available</h2>
    <p style="color:#374151;line-height:1.6;">Dear ${parentName},</p>
    <p style="color:#374151;line-height:1.6;">The <strong>${termName} term</strong> report card for <strong>${studentName}</strong> for the <strong>${sessionName}</strong> session is now available.</p>
    <p style="color:#374151;line-height:1.6;">Log in to your parent portal to view and download the report card.</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Report Card</a>
  `);
  await sendEmail({ to, subject: `${studentName}'s Report Card is Ready - ${SCHOOL}`, html });
}

export async function sendReportDeclinedEmail(
  to: string,
  teacherName: string,
  className: string,
  termName: string,
  reason: string
): Promise<void> {
  const html = baseTemplate(`
    <h2 style="color:#dc2626;margin:0 0 16px;">Report Card Declined</h2>
    <p style="color:#374151;line-height:1.6;">Dear ${teacherName},</p>
    <p style="color:#374151;line-height:1.6;">The report card submission for <strong>${className}</strong> (${termName} term) has been declined.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="color:#dc2626;margin:0;font-weight:600;">Reason:</p>
      <p style="color:#374151;margin:8px 0 0;">${reason}</p>
    </div>
    <p style="color:#374151;line-height:1.6;">Please review and resubmit at your earliest convenience.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/teacher/results" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Review & Resubmit</a>
  `);
  await sendEmail({ to, subject: `Report Card Declined - ${className} - ${SCHOOL}`, html });
}



// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);
// const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
// const SCHOOL = "God's Way Model Groups of Schools";

// interface SendEmailOptions {
//   to: string | string[];
//   subject: string;
//   html: string;
// }

// export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
//   try {
//     await resend.emails.send({ from: FROM, to, subject, html });
//   } catch (error) {
//     console.error("Email send error:", error);
//     // don't rethrow — email failure shouldn't break the main operation
//   }
// }
// // ─── Templates ────────────────────────────────────────────────────────────────

// function baseTemplate(content: string): string {
//   return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="utf-8"/>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//         <title>${SCHOOL}</title>
//       </head>
//       <body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,serif;">
//         <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
//           <div style="background:linear-gradient(135deg,#1e3a5f 0%,#0a1628 100%);padding:32px;text-align:center;">
//             <h1 style="color:#f59e0b;font-size:20px;margin:0 0 4px;">${SCHOOL}</h1>
//             <p style="color:#94a3b8;font-size:12px;margin:0;">Excellence • Integrity • Faith</p>
//           </div>
//           <div style="padding:32px;">
//             ${content}
//           </div>
//           <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
//             <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} ${SCHOOL}. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//     </html>
//   `;
// }

// export async function sendWelcomeEmail(
//   to: string,
//   firstName: string,
//   role: string,
//   tempPassword: string
// ): Promise<void> {
//   const html = baseTemplate(`
//     <h2 style="color:#1e3a5f;margin:0 0 16px;">Welcome to ${SCHOOL}!</h2>
//     <p style="color:#374151;line-height:1.6;">Dear ${firstName},</p>
//     <p style="color:#374151;line-height:1.6;">Your account has been created as <strong>${role}</strong>. Use the credentials below to sign in:</p>
//     <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
//       <p style="margin:0 0 8px;color:#374151;"><strong>Email:</strong> ${to}</p>
//       <p style="margin:0;color:#374151;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
//     </div>
//     <p style="color:#ef4444;font-size:14px;">Please change your password immediately after your first login.</p>
//     <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-in" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Sign In Now</a>
//   `);
//   await sendEmail({ to, subject: `Welcome to ${SCHOOL} - Account Created`, html });
// }

// export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<void> {
//   const html = baseTemplate(`
//     <h2 style="color:#1e3a5f;margin:0 0 16px;">Password Reset Request</h2>
//     <p style="color:#374151;line-height:1.6;">Dear ${firstName},</p>
//     <p style="color:#374151;line-height:1.6;">You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
//     <a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:24px 0;">Reset Password</a>
//     <p style="color:#6b7280;font-size:14px;">If you didn't request this, please ignore this email.</p>
//   `);
//   await sendEmail({ to, subject: "Password Reset - " + SCHOOL, html });
// }

// export async function sendReportAvailableEmail(
//   to: string,
//   parentName: string,
//   studentName: string,
//   sessionName: string,
//   termName: string,
//   dashboardUrl: string
// ): Promise<void> {
//   const html = baseTemplate(`
//     <h2 style="color:#1e3a5f;margin:0 0 16px;">Report Card Available</h2>
//     <p style="color:#374151;line-height:1.6;">Dear ${parentName},</p>
//     <p style="color:#374151;line-height:1.6;">The <strong>${termName} term</strong> report card for <strong>${studentName}</strong> for the <strong>${sessionName}</strong> session is now available.</p>
//     <p style="color:#374151;line-height:1.6;">Log in to your parent portal to view and download the report card.</p>
//     <a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Report Card</a>
//   `);
//   await sendEmail({ to, subject: `${studentName}'s Report Card is Ready - ${SCHOOL}`, html });
// }

// export async function sendReportDeclinedEmail(
//   to: string,
//   teacherName: string,
//   className: string,
//   termName: string,
//   reason: string
// ): Promise<void> {
//   const html = baseTemplate(`
//     <h2 style="color:#dc2626;margin:0 0 16px;">Report Card Declined</h2>
//     <p style="color:#374151;line-height:1.6;">Dear ${teacherName},</p>
//     <p style="color:#374151;line-height:1.6;">The report card submission for <strong>${className}</strong> (${termName} term) has been declined.</p>
//     <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0;">
//       <p style="color:#dc2626;margin:0;font-weight:600;">Reason:</p>
//       <p style="color:#374151;margin:8px 0 0;">${reason}</p>
//     </div>
//     <p style="color:#374151;line-height:1.6;">Please review and resubmit at your earliest convenience.</p>
//     <a href="${process.env.NEXT_PUBLIC_APP_URL}/teacher/results" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Review & Resubmit</a>
//   `);
//   await sendEmail({ to, subject: `Report Card Declined - ${className} - ${SCHOOL}`, html });
// }
