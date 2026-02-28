import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // If authenticated and trying to access /login, redirect to home
    if (req.nextUrl.pathname === '/login' && req.nextauth.token) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl
        // Public routes that don't need authentication
        if (pathname.startsWith('/login') || pathname.startsWith('/api/user/register')) {
          return true
        }
        // API auth routes are always public
        if (pathname.startsWith('/api/auth')) {
          return true
        }
        // Everything else requires authentication
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
