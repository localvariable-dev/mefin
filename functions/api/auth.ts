/// <reference types="@cloudflare/workers-types" />
import {
  type Env,
  type UserRow,
  corsHeaders,
  jsonResponse,
  bufferToHex,
  hexToBuffer,
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
} from './_utils'

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  if (!env.DB) {
    return jsonResponse({ error: 'Database binding DB is not configured.' }, 500)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400)
  }

  const mode = String(body.mode || body.action || 'login').toLowerCase()
  const jwtSecret = env.JWT_SECRET || 'mefin-cloud-jwt-secret-key-default-2025'

  // 1. CHANGE PASSWORD
  if (mode === 'change-password') {
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyJwt(authHeader.substring(7).trim(), jwtSecret)
      if (payload && payload.sub) userId = payload.sub
    }

    let user: any = null
    if (userId) {
      user = await env.DB.prepare(
        'SELECT id, email, password_hash, salt FROM users WHERE id = ?'
      ).bind(userId).first()
    } else if (body.email && typeof body.email === 'string') {
      user = await env.DB.prepare(
        'SELECT id, email, password_hash, salt FROM users WHERE LOWER(email) = LOWER(?)'
      ).bind(body.email.trim().toLowerCase()).first()
    }

    if (!user) {
      return jsonResponse({ error: 'Unauthorized or user not found.' }, 401)
    }

    const currentPassword = String(body.currentPassword || body.password || '')
    const newPassword = String(body.newPassword || '')

    if (!currentPassword) {
      return jsonResponse({ error: 'Current password is required.' }, 400)
    }
    if (!newPassword || newPassword.length < 6) {
      return jsonResponse({ error: 'New password must be at least 6 characters.' }, 400)
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.salt, user.password_hash)
    if (!isCurrentValid) {
      return jsonResponse({ error: 'Current password is incorrect.' }, 400)
    }

    const newSaltBytes = crypto.getRandomValues(new Uint8Array(16))
    const newSaltHex = bufferToHex(newSaltBytes)
    const newHashHex = await hashPassword(newPassword, newSaltBytes)
    const now = Date.now()

    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?'
    ).bind(newHashHex, newSaltHex, now, user.id).run()

    return jsonResponse({ success: true, message: 'Password changed successfully.' }, 200)
  }

  // 2. REQUEST PASSWORD RESET
  if (mode === 'request-reset') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'Please enter a valid email address.' }, 400)
    }

    const user = await env.DB.prepare(
      'SELECT id, email, salt FROM users WHERE LOWER(email) = LOWER(?)'
    ).bind(email).first<Pick<UserRow, 'id' | 'email' | 'salt'>>()

    if (user) {
      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      const otp = String(100000 + (array[0] % 900000))
      const otpHex = await hashPassword(otp, hexToBuffer(user.salt))
      const expiresAt = Date.now() + 15 * 60 * 1000 // 15 mins

      await env.DB.prepare(
        'UPDATE users SET reset_code_hash = ?, reset_expires_at = ? WHERE id = ?'
      ).bind(otpHex, expiresAt, user.id).run()

      const resendApiKey = (env as any).RESEND_API_KEY
      if (resendApiKey) {
        const fromEmail = (env as any).RESET_FROM_EMAIL || `noreply@${new URL(request.url).hostname}`
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: 'Your Mefin Password Reset Code',
            html: `<p>Your password reset code is: <strong style="font-size:18px;letter-spacing:2px;">${otp}</strong></p><p>This code expires in 15 minutes.</p>`,
          }),
        }).catch(err => console.error('Failed to send reset email via Resend:', err))
      } else {
        console.log('[MEFIN_RESET_OTP]', email, otp)
      }
    }

    return jsonResponse({ success: true, message: 'If an account exists, a 6-digit reset code has been sent.' }, 200)
  }

  // 3. CONFIRM PASSWORD RESET
  if (mode === 'confirm-reset') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const otp = typeof body.otp === 'string' ? body.otp.trim() : ''
    const newPassword = typeof body.newPassword === 'string' ? body.password || body.newPassword : ''

    if (!email || !otp) {
      return jsonResponse({ error: 'Email and 6-digit reset code are required.' }, 400)
    }
    if (!newPassword || newPassword.length < 6) {
      return jsonResponse({ error: 'New password must be at least 6 characters.' }, 400)
    }

    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, salt, vault_json, reset_code_hash, reset_expires_at FROM users WHERE LOWER(email) = LOWER(?)'
    ).bind(email).first<any>()

    if (!user) {
      return jsonResponse({ error: 'User not found.' }, 404)
    }
    if (!user.reset_expires_at || user.reset_expires_at < Date.now()) {
      return jsonResponse({ error: 'Reset code has expired. Please request a new one.' }, 400)
    }

    const isOtpValid = user.reset_code_hash && (await verifyPassword(otp, user.salt, user.reset_code_hash))
    if (!isOtpValid) {
      return jsonResponse({ error: 'Invalid reset code. Please check and try again.' }, 400)
    }

    const newSaltBytes = crypto.getRandomValues(new Uint8Array(16))
    const newSaltHex = bufferToHex(newSaltBytes)
    const newHashHex = await hashPassword(newPassword, newSaltBytes)
    const now = Date.now()

    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, salt = ?, reset_code_hash = NULL, reset_expires_at = NULL, updated_at = ? WHERE id = ?'
    ).bind(newHashHex, newSaltHex, now, user.id).run()

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 30 * 86400,
    }, jwtSecret)

    let vault: any = null
    try {
      vault = user.vault_json && user.vault_json !== '{}' ? JSON.parse(user.vault_json) : null
    } catch {}

    return jsonResponse({
      success: true,
      token,
      user: { id: user.id, email: user.email },
      vault,
      snapshot: vault,
    }, 200)
  }

  // 4. REGISTER & LOGIN
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !email.includes('@') || email.length < 3) {
    return jsonResponse({ error: 'Please enter a valid email address.' }, 400)
  }
  if (!password || password.length < 6) {
    return jsonResponse({ error: 'Password must be at least 6 characters.' }, 400)
  }

  if (mode === 'register') {
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?)'
    ).bind(email).first()

    if (existing) {
      return jsonResponse({ error: 'An account with this email already exists. Please sign in instead.' }, 409)
    }

    const saltBytes = crypto.getRandomValues(new Uint8Array(16))
    const saltHex = bufferToHex(saltBytes)
    const hashHex = await hashPassword(password, saltBytes)
    const userId = crypto.randomUUID()
    const now = Date.now()

    const initialVault = body.vault_json
      ? (typeof body.vault_json === 'string' ? body.vault_json : JSON.stringify(body.vault_json))
      : '{}'

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, salt, vault_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email, hashHex, saltHex, initialVault, now).run()

    const token = await signJwt({
      sub: userId,
      email,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 30 * 86400,
    }, jwtSecret)

    return jsonResponse({
      token,
      user: { id: userId, email }
    }, 201)
  } else if (mode === 'login') {
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, salt FROM users WHERE LOWER(email) = LOWER(?)'
    ).bind(email).first<UserRow>()

    if (!user) {
      return jsonResponse({ error: 'Invalid email or password.' }, 401)
    }

    const isValid = await verifyPassword(password, user.salt, user.password_hash)
    if (!isValid) {
      return jsonResponse({ error: 'Invalid email or password.' }, 401)
    }

    const now = Date.now()
    const token = await signJwt({
      sub: user.id,
      email: user.email,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 30 * 86400,
    }, jwtSecret)

    return jsonResponse({
      token,
      user: { id: user.id, email: user.email }
    }, 200)
  } else {
    return jsonResponse({ error: 'Invalid mode. Supported modes are "login", "register", "change-password", "request-reset", and "confirm-reset".' }, 400)
  }
}
