import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { CLERK_ENABLED } from './lib/clerk';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sdk(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/etherfuse(.*)',
  '/_next/static/(.*)',
  '/favicon.ico',
]);

// Con Clerk apagado solo se sirven la landing, /sdk y las rutas API
// (que validan API key por su cuenta); el resto redirige a la landing.
function noAuthMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allowed =
    pathname === '/' || pathname.startsWith('/sdk') || pathname.startsWith('/api');
  if (!allowed) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export default CLERK_ENABLED
  ? clerkMiddleware((auth, req) => {
      if (!isPublicRoute(req)) auth().protect();
    })
  : noAuthMiddleware;

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)', '/__clerk/(.*)'],
};
