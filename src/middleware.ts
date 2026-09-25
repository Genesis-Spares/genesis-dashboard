// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('accessToken');
    const isAuthPage = request.nextUrl.pathname.startsWith('/login');
    // password reset is reachable signed out, and doesn't bounce signed-in users
    const isResetPage = request.nextUrl.pathname.startsWith('/forgot-password');
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');
    const isPublicRoute = request.nextUrl.pathname === '/';

    // Allow API routes
    if (isApiRoute) {
        return NextResponse.next();
    }

    // Redirect to login if no token and not on auth page
    if (!token && !isAuthPage && !isResetPage && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if token and on auth page
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};