// Save as: app/api/calling/_lib.ts
// Shared helpers for the calling API routes. The leading underscore keeps
// Next.js from treating this folder entry as a route.

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Server-side client using the service role key (never expose this to the browser).
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient(url, key, { auth: { persistSession: false } })
}

// The Android app sends a shared secret in the x-calling-key header.
export function isAuthorized(req: NextRequest) {
  const expected = process.env.CALLING_API_KEY

  if (!expected) {
    return false
  }

  return req.headers.get("x-calling-key") === expected
}

export function unauthorized() {
  return NextResponse.json(
    { status: "error", message: "Unauthorized" },
    { status: 401 }
  )
}

// 03001234567 -> +923001234567, 923001234567 -> +923001234567
export function toDialNumber(phone: string) {
  const raw = String(phone || "").trim()
  const digits = raw.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  if (digits.startsWith("92")) {
    return `+${digits}`
  }

  if (digits.startsWith("0")) {
    return `+92${digits.slice(1)}`
  }

  return raw.startsWith("+") ? `+${digits}` : digits
}