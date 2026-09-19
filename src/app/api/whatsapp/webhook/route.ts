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
      "🔐 Meta WhatsApp webhook verification"
    )

    console.log("Mode:", mode)

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
// Meta sends:
// 1. Incoming customer messages
// 2. WhatsApp message delivery statuses
// ============================================================

export async function POST(request: Request) {
  try {
    // ========================================================
    // READ RAW BODY
    // ========================================================

    const rawBody = await request.text()

    const signature =
      request.headers.get(
        "x-hub-signature-256"
      )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    console.log(
      "📥 WhatsApp webhook received"
    )

    console.log(
      "Signature:",
      signature
        ? `${signature.substring(0, 20)}...`
        : "MISSING"
    )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    // ========================================================
    // VERIFY META SIGNATURE
    // ========================================================

    if (
      !verifySignature(
        rawBody,
        signature
      )
    ) {
      console.error(
        "❌ Invalid Meta webhook signature"
      )

      return new NextResponse(
        "Unauthorized",
        {
          status: 401,
        }
      )
    }

    console.log(
      "✅ Meta webhook signature verified"
    )

    // ========================================================
    // PARSE JSON
    // ========================================================

    let body: any

    try {
      body = JSON.parse(rawBody)
    } catch {
      console.error(
        "❌ Invalid JSON payload"
      )

      return new NextResponse(
        "Bad Request",
        {
          status: 400,
        }
      )
    }

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
        "❌ Supabase admin client is not available"
      )

      return NextResponse.json(
        {
          success: false,
          error: "Supabase configuration missing",
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

    for (const entry of entries) {
      const changes =
        Array.isArray(entry?.changes)
          ? entry.changes
          : []

      for (const change of changes) {
        const value = change?.value

        if (!value) {
          continue
        }

        // ====================================================
        // METADATA
        // ====================================================

        console.log(
          "📱 Display phone:",
          value?.metadata
            ?.display_phone_number ||
            "unknown"
        )

        console.log(
          "📱 Phone number ID:",
          value?.metadata
            ?.phone_number_id ||
            "unknown"
        )

        // ====================================================
        // PART 1
        // WHATSAPP DELIVERY STATUSES
        //
        // sent
        // delivered
        // read
        // failed
        // ====================================================

        const statuses =
          Array.isArray(value?.statuses)
            ? value.statuses
            : []

        if (statuses.length > 0) {
          console.log(
            "📊 WhatsApp status events:",
            statuses.length
          )

          for (const status of statuses) {
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

              // ==================================================
              // IGNORE INVALID STATUS
              // ==================================================

              if (!whatsappMessageId) {
                console.log(
                  "⚠️ Status has no message ID"
                )

                continue
              }

              if (!deliveryStatus) {
                console.log(
                  "⚠️ Status has no status value"
                )

                continue
              }

              // ==================================================
              // FAILURE REASON
              // ==================================================

              let failureReason: string | null =
                null

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

                if (
                  errors.length > 0
                ) {
                  failureReason =
                    errors
                      .map(
                        (error: any) => {
                          const code =
                            error?.code

                          const title =
                            error?.title

                          const message =
                            error?.message

                          const details =
                            error?.error_data
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
                            .filter(Boolean)
                            .join(" | ")
                        }
                      )
                      .filter(Boolean)
                      .join(" || ")
                }

                if (!failureReason) {
                  failureReason =
                    "WhatsApp message delivery failed"
                }

                console.error(
                  "❌ WhatsApp delivery failed:"
                )

                console.error(
                  failureReason
                )
              }

              // ==================================================
              // CONVERT META TIMESTAMP
              // ==================================================

              let statusTime: string =
                new Date().toISOString()

              if (timestamp) {
                const timestampNumber =
                  Number(timestamp)

                if (
                  Number.isFinite(
                    timestampNumber
                  )
                ) {
                  statusTime =
                    new Date(
                      timestampNumber * 1000
                    ).toISOString()
                }
              }

              // ==================================================
              // FIND ORDER
              //
              // Exact WhatsApp message ID
              // ==================================================

              const {
                data: order,
                error: findOrderError,
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

              if (findOrderError) {
                console.error(
                  "❌ Error finding order for delivery status:"
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
                  "⚠️ No order found for WhatsApp message ID:"
                )

                console.error(
                  whatsappMessageId
                )

                console.log(
                  "ℹ️ This can happen if the WhatsApp message ID was not saved in orders."
                )

                continue
              }

              console.log(
                "📦 Matching order found:"
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
                "Current WhatsApp status:",
                order.whatsapp_delivery_status
              )

              // ==================================================
              // UPDATE DELIVERY STATUS
              // ==================================================

              const updateData: {
                whatsapp_delivery_status: string
                whatsapp_failure_reason:
                  | string
                  | null
                whatsapp_last_status_at: string
              } = {
                whatsapp_delivery_status:
                  deliveryStatus,
                whatsapp_failure_reason:
                  failureReason,
                whatsapp_last_status_at:
                  statusTime,
              }

              const {
                error: updateStatusError,
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

              if (
                updateStatusError
              ) {
                console.error(
                  "❌ Failed to save WhatsApp delivery status:"
                )

                console.error(
                  updateStatusError
                )

                continue
              }

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
                "Status:",
                deliveryStatus
              )

              console.log(
                "Failure reason:",
                failureReason || "None"
              )

              console.log(
                "Status time:",
                statusTime
              )

              console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
              )
            } catch (statusError) {
              console.error(
                "❌ Error processing delivery status:"
              )

              console.error(
                statusError
              )

              // Continue processing
              // other status events.
              continue
            }
          }
        }

        // ======================================================
        // PART 2
        // INCOMING CUSTOMER MESSAGES
        // ======================================================

        const messages =
          Array.isArray(value?.messages)
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
              "ℹ️ No incoming messages in this event"
            )
          }

          continue
        }

        // ======================================================
        // PROCESS EACH MESSAGE
        // ======================================================

        for (const message of messages) {
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
              "📩 Incoming WhatsApp message"
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
              messageType === "text"
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

              // ==================================================
              // BUTTON REPLY
              // ==================================================

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

                // =================================================
                // EXACT ORIGINAL TEMPLATE MESSAGE ID
                // =================================================

                const repliedToMessageId =
                  message
                    ?.context
                    ?.id

                console.log(
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                )

                console.log(
                  "🔘 BUTTON REPLY"
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
                  "Replied-to WhatsApp Message ID:",
                  repliedToMessageId
                )

                console.log(
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                )

                // =================================================
                // CHECK CONTEXT MESSAGE ID
                // =================================================

                if (
                  !repliedToMessageId
                ) {
                  console.error(
                    "❌ No context.id found in button reply"
                  )

                  continue
                }

                // =================================================
                // DETERMINE ORDER STATUS
                //
                // Your exact customer-facing buttons:
                //
                // Confirm / تصدیق کریں
                // Cancel / منسوخ کریں
                //
                // We primarily use Meta button IDs.
                // The exact titles are also supported as fallback.
                // =================================================

                let newStatus:
                  | "confirmed"
                  | "cancelled"
                  | null = null

                // =================================================
                // CONFIRM
                // =================================================

                if (
                  buttonId ===
                    "confirm_order" ||
                  buttonTitle ===
                    "Confirm / تصدیق کریں"
                ) {
                  newStatus =
                    "confirmed"

                  console.log(
                    "✅ Customer confirmed order"
                  )
                }

                // =================================================
                // CANCEL
                // =================================================

                else if (
                  buttonId ===
                    "cancel_order" ||
                  buttonTitle ===
                    "Cancel / منسوخ کریں"
                ) {
                  newStatus =
                    "cancelled"

                  console.log(
                    "❌ Customer cancelled order"
                  )
                }

                // =================================================
                // UNKNOWN BUTTON
                // =================================================

                else {
                  console.log(
                    "ℹ️ Unknown button ID/title"
                  )

                  console.log(
                    "Button ID:",
                    buttonId
                  )

                  console.log(
                    "Button title:",
                    buttonTitle
                  )

                  continue
                }

                // =================================================
                // FIND EXACT ORDER
                //
                // IMPORTANT:
                //
                // We search using the WhatsApp message ID
                // of the original order-confirmation template.
                // =================================================

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

                // =================================================
                // DATABASE LOOKUP ERROR
                // =================================================

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

                // =================================================
                // ORDER NOT FOUND
                // =================================================

                if (!order) {
                  console.error(
                    "❌ No order found for WhatsApp message ID:"
                  )

                  console.error(
                    repliedToMessageId
                  )

                  continue
                }

                console.log(
                  "📦 Matching order found:"
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
                  "Current order status:",
                  order.order_status
                )

                // =================================================
                // PREVENT DUPLICATE UPDATE
                // =================================================

                if (
                  order.order_status ===
                  newStatus
                ) {
                  console.log(
                    `ℹ️ Order ${order.id} is already ${newStatus}`
                  )

                  continue
                }

                // =================================================
                // UPDATE ORDER STATUS
                // =================================================

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

                // =================================================
                // UPDATE ERROR
                // =================================================

                if (
                  updateError
                ) {
                  console.error(
                    "❌ Failed to update order:"
                  )

                  console.error(
                    updateError
                  )

                  continue
                }

                // =================================================
                // SUCCESS
                // =================================================

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

              // ==================================================
              // OTHER INTERACTIVE TYPES
              // ==================================================

              else {
                console.log(
                  "ℹ️ Interactive message type:",
                  interactiveType
                )
              }

              continue
            }

            // ==================================================
            // DIRECT BUTTON MESSAGE
            // ==================================================

            if (
              messageType === "button"
            ) {
              console.log(
                "🔘 Direct button message:"
              )

              console.log(
                JSON.stringify(
                  message,
                  null,
                  2
                )
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
              "❌ Error processing individual message:"
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
      "❌ WhatsApp webhook error:",
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