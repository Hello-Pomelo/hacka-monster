import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { publishDuePosts } from "@/lib/linkedin/publish-due"

// Publication à date (spec Création de post, P0 7). Appelée sans session par pg_cron, avec
// « Authorization: Bearer <CRON_SECRET> ». CRON_SECRET doit valoir le secret `cron_secret` du Vault,
// que vérifient les fonctions cron_* (security definer) : aucune clé service_role.
export const dynamic = "force-dynamic"
export const maxDuration = 60

function isAuthorized(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") ?? ""
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET n'est pas configuré." }, { status: 500 })
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  const result = await publishDuePosts(secret)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  const { claimed, published, failed, errors, skipped } = result
  return NextResponse.json({ claimed, published, failed, errors, skipped })
}

export const GET = handle
export const POST = handle
