// Updated auth.ts with an Apple-styled HTML email template
import { hashPassword, signToken, verifyToken, jsonResponse, readJson } from './_utils.js';

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET?: string; RESEND_API_KEY?: string; RESET_FROM_EMAIL?: string }> = async (context) => {
  const { request, env } = context;
  const body = await readJson(request);
  const action = body.action || body.mode;
  const secret = env.JWT_SECRET || 'mefin-cloud-jwt-secret-key-default-2025';

  if (action === "register" || action === "login") {
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;
    if (!email || !password) return jsonResponse({ error: "Email and password required" }, 400);

    if (action === "register") {
      const salt = crypto.randomUUID();
      const hash = await hashPassword(password, salt);
      const id = crypto.randomUUID();
      try {
        await env.DB.prepare("INSERT INTO users (id, email, password_hash, salt, vault_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(id, email, hash, salt, JSON.stringify(body.initialData || {}), Date.now()).run();
        const token = await signToken(id, secret);
        return jsonResponse({ token, vault: body.initialData });
      } catch {
        return jsonResponse({ error: "Account already exists with this email" }, 400);
      }
    }

    if (action === "login") {
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
      if (!user) return jsonResponse({ error: "Invalid email or password" }, 401);
      const hash = await hashPassword(password, user.salt);
      if (hash !== user.password_hash) return jsonResponse({ error: "Invalid email or password" }, 401);
      const token = await signToken(user.id, secret);
      return jsonResponse({ token, vault: JSON.parse(user.vault_json || "{}"), updatedAt: user.updated_at });
    }
  }

  if (action === "change-password") {
    const authHeader = request.headers.get("Authorization");
    const userId = await verifyToken(authHeader, secret);
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) return jsonResponse({ error: "Current and new password required" }, 400);

    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<any>();
    if (!user) return jsonResponse({ error: "User not found" }, 404);

    const currentHash = await hashPassword(currentPassword, user.salt);
    if (currentHash !== user.password_hash) return jsonResponse({ error: "Incorrect current password" }, 400);

    const newSalt = crypto.randomUUID();
    const newHash = await hashPassword(newPassword, newSalt);
    await env.DB.prepare("UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?")
      .bind(newHash, newSalt, Date.now(), userId).run();
    return jsonResponse({ ok: true });
  }

  if (action === "request-reset") {
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return jsonResponse({ error: "Email required" }, 400);

    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
    // Always return success to prevent email enumeration
    if (!user) return jsonResponse({ ok: true });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp, user.salt);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    await env.DB.prepare("UPDATE users SET reset_code_hash = ?, reset_expires_at = ? WHERE email = ?")
      .bind(otpHash, expiresAt, email).run();

    if (env.RESEND_API_KEY) {
      const fromEmail = env.RESET_FROM_EMAIL || `Mefin Security <no-reply@${new URL(request.url).hostname}>`;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif; background-color: #f5f5f7; color: #1d1d1f; margin: 0; padding: 40px 0; }
            .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.04); }
            .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #000000; margin-bottom: 24px; }
            h2 { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; margin-top: 0; color: #1d1d1f; }
            p { font-size: 15px; line-height: 1.5; color: #515154; margin-bottom: 24px; }
            .otp-box { background: #fbfbfd; border: 1px solid #d2d2d7; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1d1d1f; margin-bottom: 24px; font-family: monospace; }
            .footer { font-size: 12px; color: #86868b; border-top: 1px solid #e5e5ea; padding-top: 20px; margin-top: 32px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Mefin.</div>
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Use the verification code below to proceed. This code will expire in <strong>15 minutes</strong>.</p>
            <div class="otp-box">${otp}</div>
            <p style="font-size: 13px; color: #86868b; margin-bottom: 0;">If you didn't request this, you can safely ignore this email.</p>
            <div class="footer">© ${new Date().getFullYear()} Mefin Wealth. Secure Edge Infrastructure.</div>
          </div>
        </body>
        </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Your Mefin Password Reset Code",
          html: htmlContent
        })
      }).catch(console.error);
    } else {
      console.log("[MEFIN_RESET_OTP]", email, otp);
    }

    return jsonResponse({ ok: true });
  }

  if (action === "confirm-reset") {
    const { email: rawEmail, otp, newPassword } = body;
    const email = (rawEmail || "").trim().toLowerCase();
    if (!email || !otp || !newPassword) return jsonResponse({ error: "All fields are required" }, 400);

    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
    if (!user || !user.reset_code_hash || !user.reset_expires_at) {
      return jsonResponse({ error: "Invalid or expired reset request" }, 400);
    }

    if (Date.now() > user.reset_expires_at) {
      return jsonResponse({ error: "Reset code has expired" }, 400);
    }

    const verifyHash = await hashPassword(otp, user.salt);
    if (verifyHash !== user.reset_code_hash) {
      return jsonResponse({ error: "Invalid verification code" }, 400);
    }

    const newSalt = crypto.randomUUID();
    const newHash = await hashPassword(newPassword, newSalt);
    await env.DB.prepare("UPDATE users SET password_hash = ?, salt = ?, reset_code_hash = NULL, reset_expires_at = NULL, updated_at = ? WHERE email = ?")
      .bind(newHash, newSalt, Date.now(), email).run();

    const token = await signToken(user.id, secret);
    return jsonResponse({ token, vault: JSON.parse(user.vault_json || "{}") });
  }

  return jsonResponse({ error: "Invalid action" }, 400);
};
