// Save as: app/api/calling/next/route.ts
//
// GET /api/calling/next
// The Android app calls this to get the next customer to dial.
// Responses:
//   { status: "stopped" }  queue is switched off in the admin panel
//   { status: "empty" }    nobody is due for a call right now
//   { status: "retry" }    another request grabbed the order first, ask again
//   { status: "call", ... } dial this customer

import { NextRequest, NextResponse } from "next/server"
import {
  getAdminClient,
  isAuthorized,
  unauthorized,
  toDialNumber,
  startOfTodayPkt,
  startOfTomorrowPkt,
} from "../_lib"

export const dynamic = "force-dynamic"

// A call that never reported back after this long is treated as failed.
const STALE_CALL_MINUTES = 3

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return unauthorized()
  }

  try {
    const db = getAdminClient()

    const { data: state, error: stateError } = await db
      .from("calling_state")
      .select("*")
      .eq("id", 1)
      .single()

    if (stateError) {
      throw stateError
    }

    if (!state.running) {
      return NextResponse.json({ status: "stopped" })
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const staleBefore = new Date(
      now.getTime() - STALE_CALL_MINUTES * 60000
    ).toISOString()

    // Each customer is called once per day: the next try is tomorrow, and
    // anyone already called today is skipped until then.
    const todayStartIso = new Date(startOfTodayPkt(now.getTime())).toISOString()
    const retryAt = new Date(startOfTomorrowPkt(now.getTime())).toISOString()

    // Release anything stuck in "calling" (app crashed, phone died, etc.)
    await db
      .from("call_attempts")
      .update({ outcome: "failed", ended_at: nowIso, notes: "No result reported" })
      .eq("outcome", "calling")
      .lt("started_at", staleBefore)

    await db
      .from("orders")
      .update({ call_status: "no_answer", next_call_at: retryAt })
      .eq("call_status", "calling")
      .lt("last_call_at", staleBefore)

    // Next customer: in queue, pending or confirmed (never cancelled), not dispatched,
    // attempts left, due now, and not already called today
    const { data: candidates, error: candidateError } = await db
      .from("orders")
      .select("*")
      .eq("in_call_queue", true)
      .eq("dispatched", false)
      .or("order_status.eq.pending,order_status.eq.confirmed,order_status.is.null")
      .in("call_status", ["not_called", "no_answer", "callback"])
      .lt("call_attempts", state.max_attempts)
      .or(`next_call_at.is.null,next_call_at.lte.${nowIso}`)
      // Not called yet today (a customer who asked for a call back is the exception)
      .or(
        `last_call_at.is.null,last_call_at.lt.${todayStartIso},call_status.eq.callback`
      )
      .order("next_call_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true })
      .limit(1)

    if (candidateError) {
      throw candidateError
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ status: "empty" })
    }

    const order = candidates[0]
    const attemptNumber = Number(order.call_attempts || 0) + 1

    // Claim it. The extra call_status check stops two requests taking the same order.
    const { data: claimed, error: claimError } = await db
      .from("orders")
      .update({
        call_status: "calling",
        call_attempts: attemptNumber,
        last_call_at: nowIso,
        next_call_at: null,
      })
      .eq("id", order.id)
      .eq("call_status", order.call_status)
      .select("id")

    if (claimError) {
      throw claimError
    }

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ status: "retry" })
    }

    const { data: attempt, error: attemptError } = await db
      .from("call_attempts")
      .insert({
        order_id: String(order.id),
        phone: order.phone,
        attempt_number: attemptNumber,
        sim_slot: 0,
      })
      .select("id")
      .single()

    if (attemptError) {
      throw attemptError
    }

    return NextResponse.json({
      status: "call",
      attemptId: attempt.id,
      attemptNumber,
      simSlot: 0,
      ringTimeoutSeconds: state.ring_timeout_seconds,
      order: {
        id: order.id,
        name: order.name,
        phone: order.phone,
        dialNumber: toDialNumber(order.phone),
        city: order.city,
        address: order.address,
        items: Array.isArray(order.items) ? order.items : [],
        total: order.total,
      },
    })
  } catch (err: any) {
    console.error("calling/next error:", err)

    return NextResponse.json(
      { status: "error", message: err?.message || "Server error" },
      { status: 500 }
    )
  }
}