import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const token = process.env.POSTEX_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Missing POSTEX_API_TOKEN" }, { status: 500 });
    }

    // ✅ Do NOT send operationalCityType at all — PostEx rejects it
    const response = await axios.get(
      "https://api.postex.pk/services/integration/api/order/v2/get-operational-city",
      {
        headers: {
          token,
        },
        timeout: 10000,
      }
    );

    // ✅ Filter delivery cities only
    const deliveryCities = (response.data.dist || []).filter(
      (city: any) => city.isDeliveryCity === true
    );

    return NextResponse.json({
      statusCode: response.data.statusCode,
      statusMessage: response.data.statusMessage,
      dist: deliveryCities,
    });
  } catch (err: any) {
    console.error("Error fetching PostEx cities:", err?.response?.data || err.message);
    return NextResponse.json(
      {
        error: "Failed to fetch operational cities",
        details: err?.response?.data || err.message,
      },
      { status: err?.response?.status || 500 }
    );
  }
}
