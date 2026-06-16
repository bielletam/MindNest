import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("mn_session");
  const { pathname } = request.nextUrl;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/document/:path*"],
};
