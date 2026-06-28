/**
 * Superadmin Settings API
 *
 * GET  /api/superadmin/settings       — List all settings (secrets masked)
 * POST /api/superadmin/settings       — Save one or more settings
 * DELETE /api/superadmin/settings     — Delete a setting (revert to env var)
 *
 * All requests require superadmin cookie authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, saveSetting, deleteSetting, SETTING_DEFINITIONS } from '@/lib/settings'

// ── Auth check ────────────────────────────────────────────────────────────

function isSuperadmin(request: NextRequest): boolean {
  const cookie = request.cookies.get('superadmin_key')?.value
  const secret = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'
  return cookie === secret
}

// ── GET: List all settings ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isSuperadmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const reveal = url.searchParams.get('reveal') === 'true'

    const settings = await getAllSettings(reveal)

    // Group by category
    const grouped: Record<string, typeof settings> = {}
    for (const setting of settings) {
      if (!grouped[setting.category]) grouped[setting.category] = []
      grouped[setting.category].push(setting)
    }

    return NextResponse.json({
      success: true,
      settings: grouped,
      total: settings.length,
      configured: settings.filter(s => s.source !== 'unset').length,
    })
  } catch (error) {
    console.error('[Superadmin Settings] GET error:', error)
    return NextResponse.json({ success: true, settings: {}, total: 0, configured: 0 })
  }
}

// ── POST: Save settings ──────────────────────────────────────────────────

interface SaveSettingsBody {
  settings: Array<{ key: string; value: string }>
  revealSecrets?: boolean
}

export async function POST(request: NextRequest) {
  if (!isSuperadmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as SaveSettingsBody
    const { settings, revealSecrets } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'settings must be an array of { key, value } objects' },
        { status: 400 }
      )
    }

    // Validate all keys exist in definitions
    const validKeys = new Set(SETTING_DEFINITIONS.map(d => d.key))
    for (const s of settings) {
      if (!validKeys.has(s.key)) {
        return NextResponse.json(
          { error: `Unknown setting key: ${s.key}` },
          { status: 400 }
        )
      }
    }

    // Save all settings
    const results: Array<{ key: string; status: 'saved' | 'skipped' }> = []

    for (const s of settings) {
      const value = s.value.trim()
      if (!value) {
        await deleteSetting(s.key)
        results.push({ key: s.key, status: 'skipped' })
      } else {
        await saveSetting(s.key, value, 'superadmin')
        results.push({ key: s.key, status: 'saved' })
      }
    }

    // Return updated settings
    const updated = await getAllSettings(revealSecrets)

    return NextResponse.json({
      success: true,
      results,
      settings: updated,
      message: `${results.filter(r => r.status === 'saved').length} setting(s) saved, ${results.filter(r => r.status === 'skipped').length} reverted to env var`,
    })
  } catch (error) {
    console.error('[Superadmin Settings] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save settings' })
  }
}

// ── DELETE: Delete a setting (revert to env var) ──────────────────────────

interface DeleteSettingsBody {
  key: string
}

export async function DELETE(request: NextRequest) {
  if (!isSuperadmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as DeleteSettingsBody
    const { key } = body

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    const validKeys = new Set(SETTING_DEFINITIONS.map(d => d.key))
    if (!validKeys.has(key)) {
      return NextResponse.json({ error: `Unknown setting key: ${key}` }, { status: 400 })
    }

    await deleteSetting(key)

    return NextResponse.json({
      success: true,
      message: `Setting "${key}" deleted. Will fall back to environment variable.`,
    })
  } catch (error) {
    console.error('[Superadmin Settings] DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete setting' })
  }
}
