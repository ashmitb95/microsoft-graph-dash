import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Allow login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // For protected routes like /dashboard, check auth via cookie
  // Note: In a production app, you might want to verify the JWT here
  // For now, we'll let the client-side handle redirects
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

