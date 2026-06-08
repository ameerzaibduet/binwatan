export async function syncAllManualOrders() {
  const [postexRes, nextstepRes] = await Promise.all([
    fetch("/api/postex/sync-orders", { method: "POST" }),
    fetch("/api/nextstep/sync-orders", { method: "POST" }),
  ])

  const postex = await postexRes.json()
  const nextstep = await nextstepRes.json()

  return {
    success: postex.success !== false && nextstep.success !== false,
    postex,
    nextstep,
    message: [
      postex.message,
      nextstep.message,
    ]
      .filter(Boolean)
      .join(" | "),
  }
}

export async function syncAllWebOrders() {
  const [postexRes, nextstepRes] = await Promise.all([
    fetch("/api/postex/sync-web-orders", { method: "POST" }),
    fetch("/api/nextstep/sync-web-orders", { method: "POST" }),
  ])

  const postex = await postexRes.json()
  const nextstep = await nextstepRes.json()

  return {
    success: postex.success !== false && nextstep.success !== false,
    postex,
    nextstep,
    message: [
      postex.message,
      nextstep.message,
    ]
      .filter(Boolean)
      .join(" | "),
  }
}
