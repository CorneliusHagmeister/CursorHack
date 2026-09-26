import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_SHOPPER_COOKIE,
  DEMO_SHOPPER_PASSWORD,
  RETURNING_SHOPPER,
} from "@/lib/shopper";
import { takeSessionCode } from "@/lib/session-codes";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

const setDemoCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SHOPPER_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    demo?: boolean;
    code?: string;
  };

  if (typeof body.code === "string" && body.code.trim()) {
    const shopper = takeSessionCode(body.code);
    if (!shopper || shopper.id !== RETURNING_SHOPPER.id) {
      return NextResponse.json(
        {
          error: "That code has expired or was already used.",
          hint: "Ask the shopper to copy a new note from Account. Do not ask for their password.",
        },
        { status: 401 }
      );
    }
    await setDemoCookie();
    return NextResponse.json({
      ok: true,
      mode: "code",
      shopper: { name: shopper.name, email: shopper.email },
    });
  }

  if (body.demo) {
    await setDemoCookie();
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
    await setDemoCookie();
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
