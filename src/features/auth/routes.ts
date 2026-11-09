const SIGN_IN_PATH = "/sign-in";
const PUBLIC_PATHS = ["/", SIGN_IN_PATH, "/api/auth", "/r", "/terms", "/privacy"];

export function redirectFor(pathname: string, hasSessionCookie: boolean): string | null {
  if (hasSessionCookie || isPublic(pathname)) {
    return null;
  }
  return SIGN_IN_PATH;
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
