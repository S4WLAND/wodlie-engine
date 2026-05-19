/**
 * Proxy de rutas: protección y redirección
 *
 * Redirige al login del frontend-public si no hay cookie auth-token.
 * El login es compartido entre admin y public via cookie cross-subdomain.
 * PENDIENTE: validar JWT y verificar role === 'admin' cuando el backend implemente auth.
 * Renombrado de middleware.ts a proxy.ts por breaking change en Next.js 16.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getPostLoginPath(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isPrivateRoute = !isAuthRoute

  if (isPrivateRoute && !token) {
    const loginUrl = new URL(
      process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
        : 'http://localhost:3001/login',
    )
    loginUrl.searchParams.set('redirect', 'admin')
    loginUrl.searchParams.set('path', getPostLoginPath(request))
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
