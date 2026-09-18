import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN

const APP_SECRET =
  process.env.WHATSAPP_APP_SECRET

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL

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

  if (
    !signature.startsWith(
      "sha256="
    )
  ) {
    console.error(
      "❌ Invalid signature format"
    )

    return false
  }

  const receivedSignature =
    signature.substring(
      "sha256=".length
    )

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        APP_SECRET
      )
      .update(
        rawBody,
        "utf8"
      )
      .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(
        receivedSignature,
        "hex"
      ),
      Buffer.from(
        expectedSignature,
        "hex"
      )
    )
  } catch {
    return false
  }
}

// ============================================================
// GET
//
// Meta uses this when verifying the webhook URL.
// ============================================================

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url)

    const mode =
      url.searchParams.get(
        "hub.mode"
      )

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

    console.log(
      "Mode:",
      mode
    )

    console.log(
      "Token received:",
      token
        ? "YES"
        : "NO"
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
// Meta sends incoming WhatsApp messages here.
// ============================================================

export async function POST(
  request: Request
) {
  try {
    // --------------------------------------------------------
    // READ RAW BODY
    //
    // IMPORTANT:
    // Signature must be calculated against the raw body.
    // --------------------------------------------------------

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
      "📥 WhatsApp webhook received"
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

    // --------------------------------------------------------
    // VERIFY SIGNATURE
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------------

    let body: any

    try {
      body =
        JSON.parse(
          rawBody
        )
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

    // --------------------------------------------------------
    // VERIFY META OBJECT
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // LOOP THROUGH ENTRIES
    // --------------------------------------------------------

    const entries =
      Array.isArray(
        body?.entry
      )
        ? body.entry
        : []

    for (
      const entry of entries
    ) {
      const changes =
        Array.isArray(
          entry?.changes
        )
          ? entry.changes
          : []

      for (
        const change of changes
      ) {
        const value =
          change?.value

        if (!value) {
          continue
        }

        // ----------------------------------------------------
        // METADATA
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // MESSAGES
        // ----------------------------------------------------

        const messages =
          Array.isArray(
            value?.messages
          )
            ? value.messages
            : []

        if (
          messages.length === 0
        ) {
          console.log(
            "ℹ️ No incoming messages in this event"
          )

          continue
        }

        // ----------------------------------------------------
        // PROCESS EACH MESSAGE
        // ----------------------------------------------------

        for (
          const message of messages
        ) {
          try {
            // =================================================
            // BASIC MESSAGE DATA
            // =================================================

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

            // =================================================
            // IGNORE MISSING SENDER
            // =================================================

            if (!from) {
              console.log(
                "⚠️ Message has no sender"
              )

              continue
            }

            // =================================================
            // IGNORE GROUP MESSAGES
            // =================================================

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

            // =================================================
            // FROM-ME CHECK
            //
            // Normally incoming messages have fromMe=false.
            // Keep this check if Meta supplies it.
            // =================================================

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

            // =================================================
            // TEXT MESSAGE
            // =================================================

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

            // =================================================
            // INTERACTIVE MESSAGE
            // =================================================

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

              // =================================================
              // BUTTON REPLY
              // =================================================

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

                // IMPORTANT:
                //
                // This is the WhatsApp message ID
                // of the template the customer replied to.
                //
                // We saved this ID in:
                //
                // orders.whatsapp_message_id
                //
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

                // ------------------------------------------------
                // CHECK MESSAGE ID
                // ------------------------------------------------

                if (
                  !repliedToMessageId
                ) {
                  console.error(
                    "❌ No context.id found in button reply"
                  )

                  continue
                }

                // ------------------------------------------------
                // CHECK BUTTON ID
                //
                // IMPORTANT:
                // We use actual Meta button IDs here.
                //
                // If your real webhook gives different IDs,
                // replace these AFTER testing.
                // ------------------------------------------------

                let newStatus:
                  | "confirmed"
                  | "cancelled"
                  | null =
                  null

                switch (
                  buttonId
                ) {
                  case "confirm_order":
                    newStatus =
                      "confirmed"

                    console.log(
                      "✅ Customer confirmed order"
                    )

                    break

                  case "cancel_order":
                    newStatus =
                      "cancelled"

                    console.log(
                      "❌ Customer cancelled order"
                    )

                    break

                  default:
                    console.log(
                      "ℹ️ Unknown button ID:",
                      buttonId
                    )

                    continue
                }

                // ------------------------------------------------
                // CHECK SUPABASE
                // ------------------------------------------------

                if (
                  !supabaseAdmin
                ) {
                  console.error(
                    "❌ Supabase admin client is not available"
                  )

                  continue
                }

                // ------------------------------------------------
                // FIND EXACT ORDER
                //
                // This is the important part.
                //
                // We DON'T search only by phone number.
                //
                // We search by the exact WhatsApp message
                // that the customer replied to.
                // ------------------------------------------------

                const {
                  data: order,
                  error:
                    findOrderError,
                } =
                  await supabaseAdmin
                    .from(
                      "orders"
                    )
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

                // ------------------------------------------------
                // DATABASE LOOKUP ERROR
                // ------------------------------------------------

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

                // ------------------------------------------------
                // ORDER NOT FOUND
                // ------------------------------------------------

                if (!order) {
                  console.error(
                    "❌ No order found for WhatsApp message ID:",
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
                  "Current status:",
                  order.order_status
                )

                // ------------------------------------------------
                // PREVENT UNNECESSARY DUPLICATE UPDATE
                // ------------------------------------------------

                if (
                  order.order_status ===
                  newStatus
                ) {
                  console.log(
                    `ℹ️ Order ${order.id} is already ${newStatus}`
                  )

                  continue
                }

                // ------------------------------------------------
                // UPDATE ORDER
                // ------------------------------------------------

                const {
                  error:
                    updateError,
                } =
                  await supabaseAdmin
                    .from(
                      "orders"
                    )
                    .update({
                      order_status:
                        newStatus,
                    })
                    .eq(
                      "id",
                      order.id
                    )

                // ------------------------------------------------
                // UPDATE ERROR
                // ------------------------------------------------

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

                // ------------------------------------------------
                // SUCCESS
                // ------------------------------------------------

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

              // =================================================
              // OTHER INTERACTIVE TYPES
              // =================================================

              else {
                console.log(
                  "ℹ️ Interactive message type:",
                  interactiveType
                )
              }

              continue
            }

            // =================================================
            // BUTTON TYPE
            //
            // Some payloads/providers may expose a direct
            // button structure.
            // =================================================

            if (
              messageType ===
              "button"
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

            // =================================================
            // OTHER MESSAGE TYPES
            // =================================================

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
              "❌ Error processing individual message:",
              messageError
            )

            // Continue processing other messages.
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