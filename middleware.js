import { NextResponse } from 'next/server';

// Define route protection rules: path -> allowed roles
export const routePermissions = {
  '/dashboard/admin': ['hod'],
  '/dashboard/faculty': ['hod', 'faculty'],
  '/dashboard/student': ['hod', 'faculty', 'student'],
  '/dashboard/librarian': ['hod', 'librarian'],
  '/dashboard/password-change': ['hod', 'faculty', 'student', 'librarian', 'admin'], // Allow all roles to access password change page
  // Add more protected routes as needed
};

export function middleware(request) {
  // Skip middleware for API routes and public static assets
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Get auth session from session cookie or server session
  const userSession = request.cookies.get('user-session')?.value;
  // If no session but trying to access a protected route
  const isProtectedRoute = Object.keys(routePermissions).some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if(userSession && request.nextUrl.pathname === '/auth') {
    // Redirect to dashboard if already authenticated and trying to access auth page
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!userSession && isProtectedRoute) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If authenticated, check role-based permissions for protected routes
  for (const [route, allowedRoles] of Object.entries(routePermissions)) {
    if (request.nextUrl.pathname.startsWith(route)) {
      // Special handling for password change page - just check if user is authenticated
      if (route === '/dashboard/password-change' && userSession) {
        return NextResponse.next();
      }
      
      try {
        // Try to parse the session to get user role
        const userInfo = userSession ? JSON.parse(userSession) : null;
        const userRole = userInfo?.role || null;
        
        // Check if user has permission to access this route
        if (!userRole || !allowedRoles.includes(userRole)) {
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      } catch (error) {
        console.error('Error parsing user session:', error);
        // Redirect to login on error
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Specify the paths where middleware should run
export const config = {
  matcher: [
    // Protect routes
    '/dashboard/:path*',
    // Exclude these paths
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};