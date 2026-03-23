import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret";

interface TokenUser {
  id: string;
  email: string;
  role: string;
  membershipTier: number;
  balance: number;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  const publicRoutes = ["/", "/login", "/register", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check for token
  const token = req.cookies.get("token")?.value;
  let user: TokenUser | null = null;

  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET) as TokenUser;
    } catch {
      user = null;
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect admin routes (need ADMIN role)
  if (pathname.startsWith("/admin") && (!user || user.role !== "ADMIN")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow public routes
  if (isPublicRoute || user) {
    return NextResponse.next();
  }

  // Redirect to login for any other protected route
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
