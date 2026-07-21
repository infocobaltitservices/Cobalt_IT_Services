import nodemailer from "nodemailer";

function getMailConfig() {
  const url = process.env.SMTP_URL;
  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || user || process.env.COMPANY_EMAIL;

  if (!from) {
    return null;
  }

  if (!url && (!host || !user || !pass)) {
    return null;
  }

  return {
    url: url || null,
    service: service || null,
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    from,
    companyName: process.env.COMPANY_NAME || "Cobalt",
    companyEmail: process.env.COMPANY_EMAIL || from,
    supportEmail: process.env.SUPPORT_EMAIL || from,
  };
}

export function hasMailConfig() {
  return Boolean(getMailConfig());
}

function createTransport() {
  const config = getMailConfig();
  if (!config) return null;

  const transportOptions = config.url
    ? { url: config.url }
    : {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      };

  if (config.service) {
    transportOptions.service = config.service;
    delete transportOptions.host;
    delete transportOptions.port;
    delete transportOptions.secure;
  }

  if (String(process.env.SMTP_ALLOW_SELF_SIGNED_CERTS || "").toLowerCase() === "true") {
    transportOptions.tls = { rejectUnauthorized: false };
  }

  return {
    transport: nodemailer.createTransport(transportOptions),
    config,
  };
}

function buildReplyHtml({ companyName, name, email, phone, company, message }) {
  const safeName = name || "there";
  const safeMessage = escapeHtml(message || "").replace(/\n/g, "<br/>");

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Thank you for contacting ${companyName}.</h2>
      <p style="margin: 0 0 16px;">Hi ${safeName}, we received your message and our team will get back to you shortly.</p>
      <div style="padding: 16px; border-radius: 12px; background: #f8fbff; border: 1px solid #dbeafe; margin-bottom: 16px;">
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email || "-"}</p>
        <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${phone || "-"}</p>
        <p style="margin: 0 0 8px;"><strong>Company:</strong> ${company || "-"}</p>
        <p style="margin: 0;"><strong>Message:</strong><br/>${safeMessage || "-"}</p>
      </div>
      <p style="margin: 0;">Best regards,<br/>${companyName} Team</p>
    </div>
  `;
}

function buildReplyText({ companyName, name, email, phone, company, message }) {
  return [
    `Thank you for contacting ${companyName}.`,
    "",
    `Hi ${name || "there"}, we received your message and our team will get back to you shortly.`,
    "",
    `Email: ${email || "-"}`,
    `Phone: ${phone || "-"}`,
    `Company: ${company || "-"}`,
    "Message:",
    message || "-",
    "",
    `Best regards,`,
    `${companyName} Team`,
  ].join("\n");
}

function buildNotificationText({ companyName, name, email, phone, company, message }) {
  return [
    `New contact inquiry received at ${companyName}.`,
    "",
    `Name: ${name || "-"}`,
    `Email: ${email || "-"}`,
    `Phone: ${phone || "-"}`,
    `Company: ${company || "-"}`,
    "Message:",
    message || "-",
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInquiryEmails(inquiry) {
  const session = createTransport();
  if (!session) {
    console.warn("Mail disabled: SMTP env vars are incomplete");
    return { enabled: false, replySent: false, notificationSent: false };
  }

  const { transport, config } = session;
  const { companyName, companyEmail, supportEmail, from } = config;
  const replySubject = `Thank you for contacting ${companyName}`;
  const notificationSubject = `New inquiry from ${inquiry.name || "website visitor"}`;

  const replyMail = inquiry.email
    ? {
        from: `${companyName} <${from}>`,
        to: inquiry.email,
        replyTo: companyEmail,
        subject: replySubject,
        text: buildReplyText({ companyName, ...inquiry }),
        html: buildReplyHtml({ companyName, ...inquiry }),
      }
    : null;

  const notificationMail = {
    from: `${companyName} <${from}>`,
    to: supportEmail,
    replyTo: inquiry.email || companyEmail,
    subject: notificationSubject,
    text: buildNotificationText({ companyName, ...inquiry }),
  };

  const [replyResult, notificationResult] = await Promise.allSettled([
    replyMail ? transport.sendMail(replyMail) : Promise.resolve(null),
    supportEmail ? transport.sendMail(notificationMail) : Promise.resolve(null),
  ]);

  if (replyResult.status === "rejected") {
    console.error("Inquiry reply email failed", {
      to: inquiry.email,
      error: replyResult.reason?.message || replyResult.reason,
    });
  }

  if (notificationResult.status === "rejected") {
    console.error("Inquiry notification email failed", {
      to: supportEmail,
      error: notificationResult.reason?.message || notificationResult.reason,
    });
  }

  return {
    enabled: true,
    replySent: replyResult.status === "fulfilled",
    notificationSent: notificationResult.status === "fulfilled",
    replyError: replyResult.status === "rejected" ? replyResult.reason?.message || "Reply mail failed" : null,
    notificationError:
      notificationResult.status === "rejected" ? notificationResult.reason?.message || "Notification mail failed" : null,
  };
}
