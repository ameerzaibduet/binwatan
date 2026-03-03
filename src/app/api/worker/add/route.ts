import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      worker_id,
      worker_code,
      date,
      covers_stitched,
      salary_generated,
      amount_given,
    } = body;

    if (!date) {
      return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("worker_records").insert([
      {
        worker_id,
        worker_code,
        date,
        covers_stitched,
        salary_generated,
        amount_given,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}