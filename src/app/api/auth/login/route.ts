import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_SHOPPER_COOKIE,
  DEMO_SHOPPER_PASSWORD,
  RETURNING_SHOPPER,
} from "@/lib/shopper";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    demo?: boolean;
  };

  if (body.demo) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_SHOPPER_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return NextResponse.json({
      ok: true,
      mode: "demo",
      shopper: { name: RETURNING_SHOPPER.name, email: RETURNING_SHOPPER.email },
    });
  }

  if (isSupabaseConfigured() && body.email && body.password) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase!.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message, hint: "Try Continue as demo shopper for the stage" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      ok: true,
      mode: "supabase",
      shopper: { email: data.user?.email },
    });
  }

  // Fallback: accept Sam credentials against seed even without Supabase
  if (
    body.email === RETURNING_SHOPPER.email &&
    body.password === DEMO_SHOPPER_PASSWORD
  ) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_SHOPPER_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  return NextResponse.json(
    {
      error: "Sign-in failed",
      hint: "Use Continue as demo shopper, or Sam's email with password indigo-demo",
    },
    { status: 401 }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SHOPPER_COOKIE);
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase!.auth.signOut();
    } catch {
      // ignore
    }
  }
  return NextResponse.json({ ok: true });
}
