import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/api/auth', '/api/register']

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p))

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (session && nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  if (session?.user.role === 'employee' && nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
