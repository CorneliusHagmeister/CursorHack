import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_SHOPPER_COOKIE, RETURNING_SHOPPER } from "@/lib/shopper";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_SHOPPER_COOKIE)?.value === "1") {
    return NextResponse.json({
      signedIn: true,
      name: RETURNING_SHOPPER.name,
      email: RETURNING_SHOPPER.email,
      mode: "demo",
    });
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      if (user) {
        return NextResponse.json({
          signedIn: true,
          name: user.user_metadata?.name ?? user.email,
          email: user.email,
          mode: "supabase",
        });
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ signedIn: false });
}
