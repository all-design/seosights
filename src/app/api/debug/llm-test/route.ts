/**
 * Debug: LLM Test — GET/POST /api/debug/llm-test
 * 
 * Quick diagnostic endpoint to test LLM calls and see raw responses.
 * Requires SuperAdmin auth. Only for debugging — not for production use.
 */

import { NextRequest, NextResponse } from 'next/server'
import { routeLLM } from '@/lib/ai-router'
import { extractJsonObject } from '@/lib/llm-utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Auth check
  const cookie = req.cookies.get('superadmin_key')?.value
  const secret = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'
  if (cookie !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({ prompt: 'Say hello', taskType: 'chat' }))
    const prompt = body.prompt || 'Return a JSON object with a "message" key saying hello and a "status" key set to "ok". Output ONLY valid JSON, no extra text.'
    const taskType = body.taskType || 'classification'
    const jsonMode = body.jsonMode !== false // default true

    console.log(`[debug/llm-test] Testing LLM with taskType=${taskType}, jsonMode=${jsonMode}`)

    const result = await routeLLM(
      [
        {
          role: 'system',
          content: 'You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text. Start with { and end with }.',
        },
        { role: 'user', content: prompt },
      ],
      {
        taskType,
        jsonMode,
        temperature: 0.3,
        timeout: 30000,
      }
    )

    const raw = result.content || ''
    const jsonStr = extractJsonObject(raw)

    return NextResponse.json({
      success: !!jsonStr,
      rawResponse: raw.slice(0, 1000),
      rawLength: raw.length,
      extractedJson: jsonStr ? jsonStr.slice(0, 500) : null,
      modelUsed: result.model,
      provider: result.provider,
      status: result.status,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
      costUsd: result.costUsd,
      fallbackChain: result.fallbackChain,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'LLM test failed',
      details: error instanceof Error ? error.message : 'Unknown',
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Auth check
  const cookie = req.cookies.get('superadmin_key')?.value
  const secret = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'
  if (cookie !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Simple test: ask for a JSON object with jsonMode=true
  try {
    const result = await routeLLM(
      [
        {
          role: 'system',
          content: 'You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text. Start with { and end with }.',
        },
        {
          role: 'user',
          content: 'Return a JSON object with these keys: "message" = "hello from seosights", "status" = "ok", "timestamp" = current date string. Output ONLY valid JSON.',
        },
      ],
      {
        taskType: 'classification',
        jsonMode: true,
        temperature: 0.3,
        timeout: 30000,
      }
    )

    const raw = result.content || ''
    const jsonStr = extractJsonObject(raw)

    return NextResponse.json({
      success: !!jsonStr,
      rawResponse: raw.slice(0, 2000),
      rawLength: raw.length,
      extractedJson: jsonStr,
      parsed: jsonStr ? (() => { try { return JSON.parse(jsonStr) } catch { return null } })() : null,
      modelUsed: result.model,
      provider: result.provider,
      status: result.status,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
      costUsd: result.costUsd,
      fallbackChain: result.fallbackChain,
      envCheck: {
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasGroqKey: !!process.env.GROQ_API_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'LLM test failed',
      details: error instanceof Error ? error.message : 'Unknown',
      envCheck: {
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasGroqKey: !!process.env.GROQ_API_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      },
    }, { status: 500 })
  }
}
