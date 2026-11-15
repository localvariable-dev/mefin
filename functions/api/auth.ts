/// <reference types="@cloudflare/workers-types" />
import {
  type Env,
  type UserRow,
  corsHeaders,
  jsonResponse,
  bufferToHex,
  hashPassword,
  verifyPassword,
  signJwt,
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
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !email.includes('@') || email.length < 3) {
    return jsonResponse({ error: 'Please enter a valid email address.' }, 400)
  }
  if (!password || password.length < 6) {
    return jsonResponse({ error: 'Password must be at least 6 characters.' }, 400)
  }

  const jwtSecret = env.JWT_SECRET || 'mefin-cloud-jwt-secret-key-default-2025'

  if (mode === 'register') {
    // Check if user already exists
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
      exp: Math.floor(now / 1000) + 30 * 86400, // 30-day token
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
    return jsonResponse({ error: 'Invalid mode. Supported modes are "login" and "register".' }, 400)
  }
}
