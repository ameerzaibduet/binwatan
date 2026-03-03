import { NextResponse } from "next/server"
import { supabaseServer } from "../../../utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, role, mobile, password } = await req.json()

    if (!name || !role || !mobile || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!["worker", "salesman", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // Create Auth User with metadata
    const { data, error } = await supabaseServer.auth.admin.createUser({
      email: `${mobile}@company.com`, // fake email (mobile login)
      password,
      email_confirm: true,
      user_metadata: {
        role,
        name,
        mobile,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 400 }
      )
    }

    // Insert into workers table
    const { error: insertError } = await supabaseServer
      .from("workers")
      .insert({
        id: data.user.id,
        name,
        role,
        mobile,
      })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: data.user.id,
    })

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}