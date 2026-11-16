
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/reset-password";

  const safeNext =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/reset-password";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_recovery_code", origin)
    );
  }

  try {
    const supabase = await createClient();

    // Exchange the PKCE code exactly once, on the server.
    // The SSR client reads the verifier from the browser's cookies
    // and writes the authenticated session back to cookies.
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Password recovery code exchange failed:", error.message);

      return NextResponse.redirect(
        new URL("/login?error=invalid_or_expired_reset_link", origin)
      );
    }

    return NextResponse.redirect(new URL(safeNext, origin));
  } catch (error) {
    console.error("Password recovery callback failed:", error);

    return NextResponse.redirect(
      new URL("/login?error=password_reset_failed", origin)
    );
  }
}
