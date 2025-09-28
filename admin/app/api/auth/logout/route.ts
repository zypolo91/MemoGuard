import { NextResponse } from "next/server";
import { jsonNoContent } from "@/lib/utils/http";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  clearSessionCookie();
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/auth/login", request.url), { status: 303 });
  }
  return jsonNoContent();
}

