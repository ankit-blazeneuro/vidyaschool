import { NextResponse } from "next/server"

export async function GET() {
  await fetch(`${process.env.BACKEND_URL}/api/health`, { cache: "no-store" }).catch(() => null)
  return NextResponse.json({ ok: true })
}
