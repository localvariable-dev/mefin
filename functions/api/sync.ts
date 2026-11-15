/// <reference types="@cloudflare/workers-types" />
import {
  type Env,
  type UserRow,
  corsHeaders,
  jsonResponse,
  verifyJwt,
} from './_utils'

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

async function authenticate(request: Request, env: Env): Promise<{ userId: string; email: string } | Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing or invalid Authorization header.' }, 401)
  }

  const token = authHeader.substring(7).trim()
  const jwtSecret = env.JWT_SECRET || 'mefin-cloud-jwt-secret-key-default-2025'
  const payload = await verifyJwt(token, jwtSecret)

  if (!payload || !payload.sub) {
    return jsonResponse({ error: 'Invalid or expired session. Please sign in again.' }, 401)
  }

  return { userId: payload.sub, email: payload.email }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  if (!env.DB) {
    return jsonResponse({ error: 'Database binding DB is not configured.' }, 500)
  }

  const auth = await authenticate(request, env)
  if (auth instanceof Response) return auth

  const user = await env.DB.prepare(
    'SELECT vault_json, updated_at FROM users WHERE id = ?'
  ).bind(auth.userId).first<Pick<UserRow, 'vault_json' | 'updated_at'>>()

  if (!user) {
    return jsonResponse({ error: 'User not found.' }, 404)
  }

  let snapshot: unknown = null
  if (user.vault_json && user.vault_json.trim() && user.vault_json !== '{}') {
    try {
      snapshot = JSON.parse(user.vault_json)
    } catch {
      snapshot = null
    }
  }

  return jsonResponse({
    snapshot,
    data: snapshot,
    updatedAt: user.updated_at,
  }, 200)
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  if (!env.DB) {
    return jsonResponse({ error: 'Database binding DB is not configured.' }, 500)
  }

  const auth = await authenticate(request, env)
  if (auth instanceof Response) return auth

  let body: any
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON snapshot body.' }, 400)
  }

  const rawSnapshot = body.snapshot !== undefined ? body.snapshot : body
  const vaultJson = typeof rawSnapshot === 'string' ? rawSnapshot : JSON.stringify(rawSnapshot)
  const now = Date.now()

  await env.DB.prepare(
    'UPDATE users SET vault_json = ?, updated_at = ? WHERE id = ?'
  ).bind(vaultJson, now, auth.userId).run()

  return jsonResponse({
    success: true,
    updatedAt: now,
  }, 200)
}

// Fallback for environments or clients posting updates
export const onRequestPost: PagesFunction<Env> = onRequestPut
