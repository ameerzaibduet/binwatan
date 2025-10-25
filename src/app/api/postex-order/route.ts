export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 🔍 Debug log for storeAddressCode
    console.log("storeAddressCode:", payload.storeAddressCode);

    const response = await fetch("https://api.postex.pk/services/integration/api/order/v3/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: process.env.POSTEX_TOKEN!,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PostEx Error:", data);
      return new Response(JSON.stringify({ error: data }), { status: 400 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Internal Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
