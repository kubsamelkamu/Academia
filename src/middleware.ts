import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const subdomain = hostname.split(".")[0]

  // Skip for localhost and main domain
  if (hostname.includes("localhost") || subdomain === "www" || !subdomain.includes("-")) {
    return NextResponse.next()
  }

  // Extract tenant from subdomain
  const tenantId = subdomain
  
  // Clone the request headers and add tenant ID
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-id", tenantId)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}