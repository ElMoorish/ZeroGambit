import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes
// Note: /analysis is PUBLIC (Free Plan includes Unlimited Game Analysis)
const isProtectedRoute = createRouteMatcher([
    '/content-studio(.*)',
    '/dashboard(.*)',
    '/coach(.*)',
    '/settings(.*)'
])

// BUT user said "Free Plan Unlimited Puzzles and Unlimited Game Analysis".
// So Analysis should be PUBLIC or at least available to free users.
// IF it requires an account, then it's Protected. 
// IF it's truly public (guest access), then not protected.
// SaaS usually requires an account even for free tier to track usage.
// So I will protect it, but any user can access.

// However, Content Studio is ADMIN ONLY.
// Middleware handles Auth (Logged In). RBAC is handled in the Page or Layout.

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
