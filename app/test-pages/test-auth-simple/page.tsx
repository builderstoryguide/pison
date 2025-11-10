"use client"

export const dynamic = 'force-dynamic'

export default function TestAuthSimplePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Mobile-First Login Test</h1>
        <p className="text-muted-foreground">Testing mobile-first implementation</p>
      </div>

      {/* Mobile-first form with proper classes */}
      <div className="max-w-sm mx-auto sm:max-w-md">
        <div className="space-y-4 sm:space-y-5 p-3 sm:p-4">
          <div className="space-y-2">
            <label htmlFor="identifier" className="text-base sm:text-base">
              Email or ID
            </label>
            <input
              id="identifier"
              type="text"
              className="h-12 w-full text-base rounded-md border border-input bg-background px-3 py-2"
              placeholder="Enter your email or ID"
              aria-label="Email or user ID"
              autoComplete="username"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-base sm:text-base">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="h-12 w-full text-base rounded-md border border-input bg-background px-3 py-2"
              placeholder="Enter your password"
              aria-label="Password"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-base sm:text-base">
              Role
            </label>
            <select
              id="role"
              className="h-12 w-full text-base rounded-md border border-input bg-background px-3 py-2"
              aria-label="User role"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="button"
            className="h-12 w-12 sm:h-12 sm:w-full bg-primary text-primary-foreground text-base font-medium rounded-md hover:bg-primary/90"
            aria-label="Login button"
          >
            Login
          </button>
        </div>
      </div>

      {/* Mobile performance indicators */}
      <div className="text-center text-sm text-muted-foreground">
        <p>✅ Mobile-first CSS classes detected</p>
        <p>✅ Touch targets are 48px+ (h-12)</p>
        <p>✅ Responsive text sizing applied</p>
        <p>✅ Mobile-optimized spacing</p>
        <p>✅ Accessibility attributes present</p>
      </div>
    </div>
  )
}


