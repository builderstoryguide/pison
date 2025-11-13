"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestUserAvatar() {
  const testUsers = [
    { name: "James Smith", avatar: null },
    { name: "Mary Johnson", avatar: null },
    { name: "John Doe", avatar: null },
    { name: "Sarah Wilson", avatar: null },
    { name: "Michael Brown", avatar: null },
    { name: "A", avatar: null }, // Single letter name
    { name: "", avatar: null }, // Empty name
    { name: "John van der Berg", avatar: null }, // Multiple words
    { name: "James Smith", avatar: "initials:JS" }, // With initials avatar
    { name: "Mary Johnson", avatar: "https://example.com/avatar.jpg" }, // With real avatar
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Avatar Test</h1>
        <p className="text-muted-foreground">
          Testing the UserAvatar component with different name formats and avatar states
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testUsers.map((user, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm">Test Case {index + 1}</CardTitle>
              <CardDescription>
                Name: "{user.name}"<br />
                Avatar: {user.avatar || "null"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar user={user} size="sm" />
                <span className="text-sm">Small</span>
              </div>
              <div className="flex items-center gap-4">
                <UserAvatar user={user} size="md" />
                <span className="text-sm">Medium</span>
              </div>
              <div className="flex items-center gap-4">
                <UserAvatar user={user} size="lg" />
                <span className="text-sm">Large</span>
              </div>
              <div className="flex items-center gap-4">
                <UserAvatar user={user} size="xl" />
                <span className="text-sm">Extra Large</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expected Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Test Case 1-5:</strong> Should show initials (JS, MJ, JD, SW, MB)</p>
          <p><strong>Test Case 6:</strong> Should show "A"</p>
          <p><strong>Test Case 7:</strong> Should show "U" (default for empty name)</p>
          <p><strong>Test Case 8:</strong> Should show "Jv" (first letters of first two words)</p>
          <p><strong>Test Case 9:</strong> Should show "JS" (from initials avatar)</p>
          <p><strong>Test Case 10:</strong> Should show the image (if it loads) or fallback to "MJ"</p>
        </CardContent>
      </Card>
    </div>
  )
}
