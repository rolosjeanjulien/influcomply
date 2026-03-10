import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes publiques (pas de redirection vers login)
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/auth/callback",
  "/directory",        // REQ-CRT-003 — annuaire public
  "/api/public",       // REQ-CRT-002 — API publique de vérification
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url && key &&
    url !== "https://placeholder.supabase.co" &&
    key !== "placeholder" &&
    url.includes(".supabase.co")
  )
}

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  // Skip auth if Supabase is not properly configured (preview/demo)
  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  let response = supabaseResponse
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Rafraîchir la session (ne pas supprimer cette ligne)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return response
  }

  const { pathname } = request.nextUrl

  // Rediriger vers /login si non authentifié sur une route protégée
  if (!user && !isPublicRoute(pathname) && pathname !== "/") {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rediriger vers /dashboard si déjà connecté sur les pages auth
  if (user && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
