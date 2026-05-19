/**
 * Proxy de rutas: protección y redirección
 *
 * Protege el prefijo privado /app/* requiriendo la cookie auth-token.
 * Redirige a /login si no hay sesión activa.
 * Redirige a /app si un usuario autenticado intenta acceder a /login.
 * El route group `(private)` organiza contexto y providers; no reemplaza este guard.
 * Se ejecuta antes de que Next.js renderice la ruta.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isAppRoute = request.nextUrl.pathname.startsWith('/app')

  if (isAppRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/login'],
}
