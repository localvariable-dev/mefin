/// <reference types="@cloudflare/workers-types" />
import {
  type Env,
  corsHeaders,
  jsonResponse,
  readJson,
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

  // 1. Authentication
  const authHeader = request.headers.get('Authorization')
  const secret = env.JWT_SECRET || 'mefin-cloud-jwt-secret-key-default-2025'
  const payload = await verifyJwt(authHeader, secret)

  if (!payload || !payload.sub) {
    return jsonResponse({ error: 'Unauthorized. Please sign in to use Mefin AI.' }, 401)
  }

  // 2. Environment Binding
  const apiKey = env.GEMINI_API_KEY
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          'GEMINI_API_KEY is not configured on Cloudflare Pages. Please add it under Settings → Variables and secrets.',
      },
      500
    )
  }

  // 3. Body Parsing
  const body = await readJson(request)
  const { message, history = [], financialContext } = body

  if (!message || typeof message !== 'string' || !message.trim()) {
    return jsonResponse({ error: 'A message prompt is required.' }, 400)
  }

  // 4. System Instruction & Context
  const systemInstructionText = `You are Mefin AI, a sharp, insightful, and concise personal finance assistant inside the Mefin personal wealth tracker.
Guidelines:
- Answer queries directly and concisely using the provided Financial Context (balances, budgets, transactions, income, expenses).
- Format all currency in Indian Rupees (₹) with appropriate commas (e.g., ₹45,000, ₹1.5L).
- Provide practical, smart, and realistic budgeting and savings suggestions.
- If information isn't present in the context, politely state it isn't recorded in their current data.
- Keep responses readable, using bullet points when comparing or listing items, and avoid repetitive disclaimers.

User Financial Context:
${financialContext ? JSON.stringify(financialContext, null, 2) : 'No context provided.'}`

  // Format history for Gemini contents
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

  if (Array.isArray(history)) {
    const recentHistory = history.slice(-6)
    for (const turn of recentHistory) {
      if (!turn || !turn.content) continue
      const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user'
      contents.push({
        role,
        parts: [{ text: String(turn.content).trim() }],
      })
    }
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  })

  // Ensure conversation starts with user turn for Gemini API compliance
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift()
  }

  const geminiPayload = {
    systemInstruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 512,
    },
  }

  // Candidate models: newest flash-lite first with resilient fallbacks
  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ]
  let lastError: string | null = null

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      })

      if (response.ok) {
        const data: any = await response.json()
        const reply =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'I could not generate an analysis based on that request.'
        return jsonResponse({ reply, model })
      }

      const errorText = await response.text()
      lastError = `Gemini (${model}): ${response.status} ${errorText}`
      // If 404 (model not available for API key/region), fall back to next model
      if (response.status === 404) {
        continue
      }
      break
    } catch (err: any) {
      lastError = err?.message || 'Error communicating with Gemini'
    }
  }

  return jsonResponse({ error: lastError || 'Failed to reach Gemini API.' }, 502)
}
