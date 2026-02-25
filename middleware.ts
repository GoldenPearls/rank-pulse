import { NextRequest, NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Personal Keyword Suite"',
    },
  });
}

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If not configured, do nothing.
  if (!user || !pass) return NextResponse.next();

  const pathname = req.nextUrl.pathname;

  // Skip Next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Allow cron endpoint to be protected by CRON_SECRET (Bearer) in the route handler.
  if (pathname === '/api/cron/daily') {
    return NextResponse.next();
  }

  const auth = req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('basic ')) {
    return unauthorized();
  }

  const base64 = auth.slice('basic '.length).trim();
  let decoded = '';
  try {
    decoded = atob(base64);
  } catch {
    return unauthorized();
  }

  const idx = decoded.indexOf(':');
  if (idx === -1) return unauthorized();

  const u = decoded.slice(0, idx);
  const p = decoded.slice(idx + 1);

  if (u !== user || p !== pass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/health).*)'],
};
