// Save as: app/api/calling/result/route.ts
//
// POST /api/calling/result
// The Android app reports how a call ended.
// Body: { attemptId, orderId, outcome, talkSeconds?, notes?, callbackAt? }
// outcome: "answered" | "no_answer" | "rejected" | "failed" | "callback"

import { NextRequest, NextResponse } from "next/server"
import { getAdminClient, isAuthorized, unauthorized } from "../_lib"

export const dynamic = "force-dynamic"

const OUTCOMES = ["answered", "no_answer", "rejected", "failed", "callback"]

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return unauthorized()
  }

  try {
    const body = await req.json()

    const { attemptId, orderId, outcome, notes = null, callbackAt = null } = body
    const talkSeconds = Math.max(0, Number(body.talkSeconds) || 0)

    if (!attemptId || !orderId || !OUTCOMES.includes(outcome)) {
      return NextResponse.json(
        { status: "error", message: "attemptId, orderId and a valid outcome are required" },
        { status: 400 }
      )
    }

    const db = getAdminClient()

    const { data: state, error: stateError } = await db
      .from("calling_state")
      .select("*")
      .eq("id", 1)
      .single()

    if (stateError) {
      throw stateError
    }

    const now = new Date()
    const nowIso = now.toISOString()

    // 1) Close out the attempt
    const { error: attemptError } = await db
      .from("call_attempts")
      .update({
        outcome,
        ended_at: nowIso,
        talk_seconds: talkSeconds,
        notes,
      })
      .eq("id", attemptId)

    if (attemptError) {
      throw attemptError
    }

    // 2) Update the order
    let orderUpdate: Record<string, unknown>

    if (outcome === "answered") {
      // Customer picked up: take them out of the queue; the admin takes over.
      orderUpdate = {
        call_status: "answered",
        in_call_queue: false,
        next_call_at: null,
      }
    } else if (outcome === "no_answer" || outcome === "rejected") {
      orderUpdate = {
        call_status: "no_answer",
        next_call_at: new Date(
          now.getTime() + state.retry_after_minutes * 60000
        ).toISOString(),
      }
    } else if (outcome === "callback") {
      const requested = callbackAt ? new Date(callbackAt) : null
      const validRequested = requested && !isNaN(requested.getTime())

      orderUpdate = {
        call_status: "callback",
        next_call_at: validRequested
          ? requested.toISOString()
          : new Date(now.getTime() + 30 * 60000).toISOString(),
      }
    } else {
      orderUpdate = {
        call_status: "failed",
        next_call_at: null,
      }
    }

    const { error: orderError } = await db
      .from("orders")
      .update(orderUpdate)
      .eq("id", orderId)

    if (orderError) {
      throw orderError
    }

    // 3) Stop the queue when a customer answers
    if (outcome === "answered") {
      const { error: pauseError } = await db
        .from("calling_state")
        .update({ running: false, paused_reason: "answered", updated_at: nowIso })
        .eq("id", 1)

      if (pauseError) {
        throw pauseError
      }
    }

    return NextResponse.json({ status: "ok", queueStopped: outcome === "answered" })
  } catch (err: any) {
    console.error("calling/result error:", err)

    return NextResponse.json(
      { status: "error", message: err?.message || "Server error" },
      { status: 500 }
    )
  }
}