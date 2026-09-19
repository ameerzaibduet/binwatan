
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const APP_SECRET = process.env.WHATSAPP_APP_SECRET

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY

// ============================================================
// SUPABASE ADMIN CLIENT
// ============================================================

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null

// ============================================================
// META WEBHOOK SIGNATURE VERIFICATION
// ============================================================

function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!APP_SECRET) {
    console.error(
      "❌ WHATSAPP_APP_SECRET is missing"
    )

    return false
  }

  if (!signature) {
    console.error(
      "❌ x-hub-signature-256 header missing"
    )

    return false
  }

  if (!signature.startsWith("sha256=")) {
    console.error(
      "❌ Invalid signature format"
    )

    return false
  }

  const receivedSignature =
    signature.substring("sha256=".length)

  const expectedSignature =
    crypto
      .createHmac("sha256", APP_SECRET)
      .update(rawBody, "utf8")
      .digest("hex")

  try {
    const receivedBuffer =
      Buffer.from(receivedSignature, "hex")

    const expectedBuffer =
      Buffer.from(expectedSignature, "hex")

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return false
    }

    return crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )
  } catch {
    return false
  }
}

// ============================================================
// GET
//
// Meta uses this to verify the webhook URL.
// ============================================================

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)

    const mode =
      url.searchParams.get("hub.mode")

    const token =
      url.searchParams.get(
        "hub.verify_token"
      )

    const challenge =
      url.searchParams.get(
        "hub.challenge"
      )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    console.log(
      "🔐 META WHATSAPP WEBHOOK VERIFICATION"
    )

    console.log(
      "Mode:",
      mode
    )

    console.log(
      "Token received:",
      token ? "YES" : "NO"
    )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    if (
      mode === "subscribe" &&
      token === VERIFY_TOKEN
    ) {
      console.log(
        "✅ Webhook verification successful"
      )

      return new NextResponse(
        challenge || "",
        {
          status: 200,
        }
      )
    }

    console.error(
      "❌ Webhook verification failed"
    )

    return new NextResponse(
      "Forbidden",
      {
        status: 403,
      }
    )
  } catch (error) {
    console.error(
      "❌ Webhook GET error:",
      error
    )

    return new NextResponse(
      "Internal Server Error",
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// POST
//
// Handles:
//
// 1. Incoming customer messages
// 2. Confirm / Cancel button replies
// 3. sent
// 4. delivered
// 5. read
// 6. failed
// ============================================================

export async function POST(request: Request) {
  try {
    // ========================================================
    // READ RAW BODY
    // ========================================================

    const rawBody =
      await request.text()

    const signature =
      request.headers.get(
        "x-hub-signature-256"
      )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    console.log(
      "📥 META WHATSAPP WEBHOOK RECEIVED"
    )

    console.log(
      "Signature:",
      signature
        ? `${signature.substring(
            0,
            20
          )}...`
        : "MISSING"
    )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    // ========================================================
    // VERIFY SIGNATURE
    // ========================================================

    if (
      !verifySignature(
        rawBody,
        signature
      )
    ) {
      console.error(
        "❌ INVALID META WEBHOOK SIGNATURE"
      )

      return new NextResponse(
        "Unauthorized",
        {
          status: 401,
        }
      )
    }

    console.log(
      "✅ META WEBHOOK SIGNATURE VERIFIED"
    )

    // ========================================================
    // PARSE JSON
    // ========================================================

    let body: any

    try {
      body =
        JSON.parse(rawBody)
    } catch {
      console.error(
        "❌ INVALID JSON PAYLOAD"
      )

      return new NextResponse(
        "Bad Request",
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // DEBUG PAYLOAD
    // ========================================================

    console.log(
      "📦 Webhook object:",
      body?.object
    )

    // ========================================================
    // VERIFY META OBJECT
    // ========================================================

    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      console.log(
        "ℹ️ Ignoring non-WhatsApp object"
      )

      return NextResponse.json({
        success: true,
      })
    }

    // ========================================================
    // CHECK SUPABASE
    // ========================================================

    if (!supabaseAdmin) {
      console.error(
        "❌ SUPABASE ADMIN CLIENT IS NOT AVAILABLE"
      )

      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase configuration missing",
        },
        {
          status: 500,
        }
      )
    }

    // ========================================================
    // LOOP THROUGH ENTRIES
    // ========================================================

    const entries =
      Array.isArray(body?.entry)
        ? body.entry
        : []

    console.log(
      "📦 Entries:",
      entries.length
    )

    for (
      const entry of entries
    ) {
      const changes =
        Array.isArray(
          entry?.changes
        )
          ? entry.changes
          : []

      console.log(
        "📦 Changes:",
        changes.length
      )

      for (
        const change of changes
      ) {
        const value =
          change?.value

        if (!value) {
          console.log(
            "⚠️ Change has no value"
          )

          continue
        }

        // ====================================================
        // METADATA
        // ====================================================

        const displayPhone =
          value?.metadata
            ?.display_phone_number ||
          "unknown"

        const phoneNumberId =
          value?.metadata
            ?.phone_number_id ||
          "unknown"

        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )

        console.log(
          "📱 WHATSAPP METADATA"
        )

        console.log(
          "Display phone:",
          displayPhone
        )

        console.log(
          "Phone number ID:",
          phoneNumberId
        )

        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )

        // ====================================================
        // PART 1
        // DELIVERY STATUS
        //
        // sent
        // delivered
        // read
        // failed
        // ====================================================

        const statuses =
          Array.isArray(
            value?.statuses
          )
            ? value.statuses
            : []

        if (
          statuses.length > 0
        ) {
          console.log(
            "📊 WhatsApp status events:",
            statuses.length
          )

          for (
            const status of statuses
          ) {
            try {
              const whatsappMessageId =
                status?.id

              const deliveryStatus =
                status?.status

              const recipientId =
                status?.recipient_id

              const timestamp =
                status?.timestamp

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              console.log(
                "📊 WHATSAPP DELIVERY STATUS"
              )

              console.log(
                "Message ID:",
                whatsappMessageId
              )

              console.log(
                "Status:",
                deliveryStatus
              )

              console.log(
                "Recipient:",
                recipientId
              )

              console.log(
                "Timestamp:",
                timestamp
              )

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              // ==================================================
              // VALIDATE MESSAGE ID
              // ==================================================

              if (
                !whatsappMessageId
              ) {
                console.log(
                  "⚠️ Status has no message ID"
                )

                continue
              }

              // ==================================================
              // VALIDATE STATUS
              // ==================================================

              if (
                !deliveryStatus
              ) {
                console.log(
                  "⚠️ Status has no status value"
                )

                continue
              }

              // ==================================================
              // FAILURE REASON
              // ==================================================

              let failureReason:
                | string
                | null = null

              if (
                deliveryStatus ===
                "failed"
              ) {
                const errors =
                  Array.isArray(
                    status?.errors
                  )
                    ? status.errors
                    : []

                console.error(
                  "❌ WHATSAPP DELIVERY FAILED"
                )

                console.error(
                  "Message ID:",
                  whatsappMessageId
                )

                console.error(
                  "Recipient:",
                  recipientId
                )

                console.error(
                  "Error count:",
                  errors.length
                )

                // ==================================================
                // FULL META ERROR OBJECT
                // ==================================================

                if (
                  errors.length > 0
                ) {
                  console.error(
                    "🔎 FULL META ERROR OBJECT:"
                  )

                  console.error(
                    JSON.stringify(
                      errors,
                      null,
                      2
                    )
                  )

                  failureReason =
                    errors
                      .map(
                        (
                          error: any
                        ) => {
                          const code =
                            error?.code

                          const title =
                            error?.title

                          const message =
                            error?.message

                          const details =
                            error
                              ?.error_data
                              ?.details

                          return [
                            code
                              ? `Code: ${code}`
                              : null,

                            title
                              ? `Title: ${title}`
                              : null,

                            message
                              ? `Message: ${message}`
                              : null,

                            details
                              ? `Details: ${details}`
                              : null,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " | "
                            )
                        }
                      )
                      .filter(
                        Boolean
                      )
                      .join(
                        " || "
                      )
                }

                if (
                  !failureReason
                ) {
                  failureReason =
                    "WhatsApp message delivery failed"
                }

                console.error(
                  "Failure reason:",
                  failureReason
                )
              }

              // ==================================================
              // CONVERT META TIMESTAMP
              // ==================================================

              let statusTime =
                new Date().toISOString()

              if (
                timestamp
              ) {
                const timestampNumber =
                  Number(timestamp)

                if (
                  Number.isFinite(
                    timestampNumber
                  )
                ) {
                  statusTime =
                    new Date(
                      timestampNumber *
                        1000
                    ).toISOString()
                }
              }

              console.log(
                "Converted status time:",
                statusTime
              )

              // ==================================================
              // FIND ORDER
              //
              // Exact WhatsApp message ID
              // ==================================================

              console.log(
                "🔎 Searching order by WhatsApp message ID..."
              )

              const {
                data: order,
                error:
                  findOrderError,
              } =
                await supabaseAdmin
                  .from("orders")
                  .select(
                    `
                    id,
                    name,
                    phone,
                    total,
                    order_status,
                    whatsapp_message_id,
                    whatsapp_delivery_status,
                    whatsapp_failure_reason,
                    whatsapp_last_status_at
                    `
                  )
                  .eq(
                    "whatsapp_message_id",
                    whatsappMessageId
                  )
                  .maybeSingle()

              // ==================================================
              // DATABASE LOOKUP ERROR
              // ==================================================

              if (
                findOrderError
              ) {
                console.error(
                  "❌ ERROR FINDING ORDER FOR DELIVERY STATUS"
                )

                console.error(
                  findOrderError
                )

                continue
              }

              // ==================================================
              // ORDER NOT FOUND
              // ==================================================

              if (!order) {
                console.error(
                  "⚠️ NO ORDER FOUND"
                )

                console.error(
                  "WhatsApp Message ID:",
                  whatsappMessageId
                )

                console.error(
                  "This usually means whatsapp_message_id was not saved in orders."
                )

                continue
              }

              // ==================================================
              // ORDER FOUND
              // ==================================================

              console.log(
                "📦 MATCHING ORDER FOUND"
              )

              console.log(
                "Order ID:",
                order.id
              )

              console.log(
                "Customer:",
                order.name
              )

              console.log(
                "Phone:",
                order.phone
              )

              console.log(
                "Current WhatsApp status:",
                order.whatsapp_delivery_status
              )

              // ==================================================
              // UPDATE DELIVERY STATUS
              // ==================================================

              const updateData = {
                whatsapp_delivery_status:
                  deliveryStatus,

                whatsapp_failure_reason:
                  failureReason,

                whatsapp_last_status_at:
                  statusTime,
              }

              console.log(
                "💾 Saving WhatsApp delivery status..."
              )

              console.log(
                "Update:",
                JSON.stringify(
                  updateData,
                  null,
                  2
                )
              )

              const {
                error:
                  updateStatusError,
              } =
                await supabaseAdmin
                  .from("orders")
                  .update(
                    updateData
                  )
                  .eq(
                    "id",
                    order.id
                  )

              // ==================================================
              // UPDATE ERROR
              // ==================================================

              if (
                updateStatusError
              ) {
                console.error(
                  "❌ FAILED TO SAVE WHATSAPP DELIVERY STATUS"
                )

                console.error(
                  updateStatusError
                )

                continue
              }

              // ==================================================
              // SUCCESS
              // ==================================================

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              console.log(
                "✅ WHATSAPP DELIVERY STATUS SAVED"
              )

              console.log(
                "Order ID:",
                order.id
              )

              console.log(
                "Message ID:",
                whatsappMessageId
              )

              console.log(
                "Status:",
                deliveryStatus
              )

              console.log(
                "Failure reason:",
                failureReason ||
                  "None"
              )

              console.log(
                "Status time:",
                statusTime
              )

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )
            } catch (
              statusError
            ) {
              console.error(
                "❌ ERROR PROCESSING DELIVERY STATUS"
              )

              console.error(
                statusError
              )

              continue
            }
          }
        }

        // ====================================================
        // PART 2
        // INCOMING CUSTOMER MESSAGES
        // ====================================================

        const messages =
          Array.isArray(
            value?.messages
          )
            ? value.messages
            : []

        if (
          messages.length === 0
        ) {
          if (
            statuses.length > 0
          ) {
            console.log(
              "ℹ️ Delivery status event processed. No incoming messages."
            )
          } else {
            console.log(
              "ℹ️ No incoming messages in this event."
            )
          }

          continue
        }

        console.log(
          "📩 Incoming messages:",
          messages.length
        )

        // ====================================================
        // PROCESS EACH MESSAGE
        // ====================================================

        for (
          const message of messages
        ) {
          try {
            // ==================================================
            // BASIC MESSAGE DATA
            // ==================================================

            const from =
              message?.from

            const messageId =
              message?.id

            const messageType =
              message?.type

            const timestamp =
              message?.timestamp

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )

            console.log(
              "📩 INCOMING WHATSAPP MESSAGE"
            )

            console.log(
              "From:",
              from
            )

            console.log(
              "Message ID:",
              messageId
            )

            console.log(
              "Type:",
              messageType
            )

            console.log(
              "Timestamp:",
              timestamp
            )

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )

            // ==================================================
            // IGNORE MISSING SENDER
            // ==================================================

            if (!from) {
              console.log(
                "⚠️ Message has no sender"
              )

              continue
            }

            // ==================================================
            // IGNORE GROUP MESSAGES
            // ==================================================

            if (
              String(from).includes(
                "@g.us"
              )
            ) {
              console.log(
                "ℹ️ Group message ignored"
              )

              continue
            }

            // ==================================================
            // FROM-ME CHECK
            // ==================================================

            const fromMe =
              message?.fromMe

            if (
              fromMe === true
            ) {
              console.log(
                "ℹ️ Outgoing message ignored"
              )

              continue
            }

            // ==================================================
            // TEXT MESSAGE
            // ==================================================

            if (
              messageType ===
              "text"
            ) {
              const text =
                message?.text?.body

              console.log(
                "💬 Customer text:",
                text || ""
              )

              continue
            }

            // ==================================================
            // INTERACTIVE MESSAGE
            //
            // Kept for compatibility with interactive
            // button_reply payloads.
            // ==================================================

            if (
              messageType ===
              "interactive"
            ) {
              const interactive =
                message?.interactive

              const interactiveType =
                interactive?.type

              console.log(
                "🔘 Interactive type:",
                interactiveType
              )

              if (
                interactiveType ===
                "button_reply"
              ) {
                const buttonId =
                  interactive
                    ?.button_reply
                    ?.id

                const buttonTitle =
                  interactive
                    ?.button_reply
                    ?.title

                const repliedToMessageId =
                  message
                    ?.context
                    ?.id

                console.log(
                  "🔘 INTERACTIVE BUTTON REPLY"
                )

                console.log(
                  "Button ID:",
                  buttonId
                )

                console.log(
                  "Button title:",
                  buttonTitle
                )

                console.log(
                  "Replied-to Message ID:",
                  repliedToMessageId
                )

                // ==================================================
                // PROCESS INTERACTIVE BUTTON
                // ==================================================

                let newStatus:
                  | "confirmed"
                  | "cancelled"
                  | null = null

                if (
                  buttonId ===
                    "confirm_order" ||
                  buttonTitle ===
                    "Confirm / تصدیق کریں"
                ) {
                  newStatus =
                    "confirmed"
                } else if (
                  buttonId ===
                    "cancel_order" ||
                  buttonTitle ===
                    "Cancel / منسوخ کریں"
                ) {
                  newStatus =
                    "cancelled"
                }

                if (
                  !newStatus
                ) {
                  console.log(
                    "ℹ️ Unknown interactive button"
                  )

                  continue
                }

                if (
                  !repliedToMessageId
                ) {
                  console.error(
                    "❌ No context.id found"
                  )

                  continue
                }

                // ==================================================
                // FIND ORDER
                // ==================================================

                const {
                  data: order,
                  error:
                    findOrderError,
                } =
                  await supabaseAdmin
                    .from("orders")
                    .select(
                      `
                      id,
                      name,
                      phone,
                      total,
                      order_status,
                      whatsapp_message_id
                      `
                    )
                    .eq(
                      "whatsapp_message_id",
                      repliedToMessageId
                    )
                    .maybeSingle()

                if (
                  findOrderError
                ) {
                  console.error(
                    "❌ Error finding order:"
                  )

                  console.error(
                    findOrderError
                  )

                  continue
                }

                if (!order) {
                  console.error(
                    "❌ NO ORDER FOUND FOR BUTTON REPLY"
                  )

                  console.error(
                    "Replied Message ID:",
                    repliedToMessageId
                  )

                  continue
                }

                console.log(
                  "📦 Matching order found:",
                  order.id
                )

                // ==================================================
                // DUPLICATE CHECK
                // ==================================================

                if (
                  order.order_status ===
                  newStatus
                ) {
                  console.log(
                    `ℹ️ Order ${order.id} is already ${newStatus}`
                  )

                  continue
                }

                // ==================================================
                // UPDATE ORDER
                // ==================================================

                const {
                  error:
                    updateError,
                } =
                  await supabaseAdmin
                    .from("orders")
                    .update({
                      order_status:
                        newStatus,
                    })
                    .eq(
                      "id",
                      order.id
                    )

                if (
                  updateError
                ) {
                  console.error(
                    "❌ FAILED TO UPDATE ORDER"
                  )

                  console.error(
                    updateError
                  )

                  continue
                }

                console.log(
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                )

                console.log(
                  "✅ ORDER UPDATED SUCCESSFULLY"
                )

                console.log(
                  "Order ID:",
                  order.id
                )

                console.log(
                  "New status:",
                  newStatus
                )

                console.log(
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                )
              }

              continue
            }

            // ==================================================
            // DIRECT BUTTON MESSAGE
            //
            // THIS IS THE ACTUAL PAYLOAD YOU RECEIVED:
            //
            // type: "button"
            //
            // button:
            // {
            //   payload: "Confirm / تصدیق کریں",
            //   text: "Confirm / تصدیق کریں"
            // }
            // ==================================================

            if (
              messageType ===
              "button"
            ) {
              const buttonPayload =
                message
                  ?.button
                  ?.payload

              const buttonText =
                message
                  ?.button
                  ?.text

              const repliedToMessageId =
                message
                  ?.context
                  ?.id

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              console.log(
                "🔘 CUSTOMER BUTTON REPLY"
              )

              console.log(
                "From:",
                from
              )

              console.log(
                "Message ID:",
                messageId
              )

              console.log(
                "Button payload:",
                buttonPayload
              )

              console.log(
                "Button text:",
                buttonText
              )

              console.log(
                "Replied-to WhatsApp Message ID:",
                repliedToMessageId
              )

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              // ==================================================
              // CHECK CONTEXT ID
              // ==================================================

              if (
                !repliedToMessageId
              ) {
                console.error(
                  "❌ NO CONTEXT.ID FOUND IN BUTTON MESSAGE"
                )

                continue
              }

              // ==================================================
              // DETERMINE ORDER STATUS
              //
              // EXACT CUSTOMER BUTTONS:
              //
              // Confirm / تصدیق کریں
              // Cancel / منسوخ کریں
              // ==================================================

              let newStatus:
                | "confirmed"
                | "cancelled"
                | null = null

              if (
                buttonPayload ===
                  "Confirm / تصدیق کریں" ||
                buttonText ===
                  "Confirm / تصدیق کریں"
              ) {
                newStatus =
                  "confirmed"

                console.log(
                  "✅ CUSTOMER CONFIRMED ORDER"
                )
              } else if (
                buttonPayload ===
                  "Cancel / منسوخ کریں" ||
                buttonText ===
                  "Cancel / منسوخ کریں"
              ) {
                newStatus =
                  "cancelled"

                console.log(
                  "❌ CUSTOMER CANCELLED ORDER"
                )
              } else {
                console.log(
                  "ℹ️ UNKNOWN BUTTON"
                )

                console.log(
                  "Payload:",
                  buttonPayload
                )

                console.log(
                  "Text:",
                  buttonText
                )

                continue
              }

              // ==================================================
              // FIND EXACT ORDER
              // ==================================================

              console.log(
                "🔎 Searching order by replied message ID..."
              )

              const {
                data: order,
                error:
                  findOrderError,
              } =
                await supabaseAdmin
                  .from("orders")
                  .select(
                    `
                    id,
                    name,
                    phone,
                    total,
                    order_status,
                    whatsapp_message_id
                    `
                  )
                  .eq(
                    "whatsapp_message_id",
                    repliedToMessageId
                  )
                  .maybeSingle()

              // ==================================================
              // DATABASE ERROR
              // ==================================================

              if (
                findOrderError
              ) {
                console.error(
                  "❌ ERROR FINDING ORDER"
                )

                console.error(
                  findOrderError
                )

                continue
              }

              // ==================================================
              // ORDER NOT FOUND
              // ==================================================

              if (!order) {
                console.error(
                  "❌ NO ORDER FOUND FOR BUTTON REPLY"
                )

                console.error(
                  "Replied Message ID:",
                  repliedToMessageId
                )

                console.error(
                  "Make sure the original template message ID is stored in orders.whatsapp_message_id."
                )

                continue
              }

              // ==================================================
              // ORDER FOUND
              // ==================================================

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              console.log(
                "📦 MATCHING ORDER FOUND"
              )

              console.log(
                "Order ID:",
                order.id
              )

              console.log(
                "Customer:",
                order.name
              )

              console.log(
                "Phone:",
                order.phone
              )

              console.log(
                "Total:",
                order.total
              )

              console.log(
                "Current order status:",
                order.order_status
              )

              console.log(
                "New order status:",
                newStatus
              )

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              // ==================================================
              // DUPLICATE CHECK
              // ==================================================

              if (
                order.order_status ===
                newStatus
              ) {
                console.log(
                  `ℹ️ Order ${order.id} is already ${newStatus}`
                )

                continue
              }

              // ==================================================
              // UPDATE ORDER STATUS
              // ==================================================

              console.log(
                "💾 Updating order status..."
              )

              const {
                error:
                  updateError,
              } =
                await supabaseAdmin
                  .from("orders")
                  .update({
                    order_status:
                      newStatus,
                  })
                  .eq(
                    "id",
                    order.id
                  )

              // ==================================================
              // UPDATE ERROR
              // ==================================================

              if (
                updateError
              ) {
                console.error(
                  "❌ FAILED TO UPDATE ORDER"
                )

                console.error(
                  updateError
                )

                continue
              }

              // ==================================================
              // SUCCESS
              // ==================================================

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              console.log(
                "✅ ORDER UPDATED SUCCESSFULLY"
              )

              console.log(
                "Order ID:",
                order.id
              )

              console.log(
                "Customer:",
                order.name
              )

              console.log(
                "Button:",
                buttonText ||
                  buttonPayload
              )

              console.log(
                "New status:",
                newStatus
              )

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )

              continue
            }

            // ==================================================
            // OTHER MESSAGE TYPES
            // ==================================================

            console.log(
              "ℹ️ Unsupported message type:",
              messageType
            )

            console.log(
              JSON.stringify(
                message,
                null,
                2
              )
            )
          } catch (
            messageError
          ) {
            console.error(
              "❌ ERROR PROCESSING INDIVIDUAL MESSAGE"
            )

            console.error(
              messageError
            )

            // Continue processing
            // other messages.
            continue
          }
        }
      }
    }

    // ========================================================
    // ALWAYS RETURN 200 AFTER VALID META WEBHOOK
    // ========================================================

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    console.log(
      "✅ META WEBHOOK PROCESSED"
    )

    console.log(
      "Returning HTTP 200"
    )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    return NextResponse.json(
      {
        success: true,
        received: true,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      "❌ WHATSAPP WEBHOOK ERROR"
    )

    console.error(
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    )
  }
}

