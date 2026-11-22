import { NextResponse, type NextRequest } from 'next/server';
import { pickLocale } from './lib/i18n';

/**
 * The locale lives in the URL. "/" redirects to /fi or /en by Accept-Language,
 * and in development /dev/states is a shortcut to /fi/dev/states.
 * No cookies are read or set.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  if (pathname === '/') {
    url.pathname = `/${pickLocale(request.headers.get('accept-language'))}`;
    const response = NextResponse.redirect(url);
    response.headers.set('Vary', 'Accept-Language');
    return response;
  }

  if (process.env.NODE_ENV !== 'production') {
    url.pathname = `/fi${pathname}`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/', '/dev/states/:path*'],
};
