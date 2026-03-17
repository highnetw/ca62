import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { type, pin } = await req.json()

  const pins: Record<string, string> = {
    entry: process.env.ENTRY_PIN || '1962',
    admin: process.env.ADMIN_PIN || '6200',
  }

  const ok = pins[type] === pin
  return NextResponse.json({ ok })
}
