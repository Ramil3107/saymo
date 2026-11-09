import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { redirectFor } from "@/features/auth/routes";

export function proxy(request: NextRequest) {
  const target = redirectFor(request.nextUrl.pathname, getSessionCookie(request) !== null);
  if (target === null) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(target, request.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|fonts/|favicon.ico|.*\\..*).*)"] };
