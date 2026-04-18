import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]),
          );
        },
      },
    },
  );

  // Required: do not write any code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPendingPath = pathname.startsWith("/pending");
  const isPublicPath =
    isAuthPath ||
    isPendingPath ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico";

  // Not logged in → send to login (except public paths)
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const status = user.user_metadata?.status as string | undefined;

    // Rejected user → sign them out and send to login
    if (status === "rejected") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("rejected", "1");
      const response = NextResponse.redirect(url);
      // Clear auth cookies so they are actually signed out
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      return response;
    }

    // Pending user → only allow /pending; block API calls, redirect all UI routes
    if (status === "pending" && !isPendingPath) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "حساب قيد الانتظار" }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }

    // Active authenticated user trying to visit login/register → send to dashboard
    if (isAuthPath && status !== "pending") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // store_worker: only allowed on /inventory, /tasks, /account, /api
    const role = user.user_metadata?.role as string | undefined;
    if (role === "store_worker" && !pathname.startsWith("/api")) {
      const allowed = ["/inventory", "/tasks", "/account"];
      const isAllowed = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
      if (!isAllowed && !isAuthPath && !isPendingPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/inventory";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
