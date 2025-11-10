"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import { useProfile, ProfileProvider } from "@/lib/profile-context"
import { BursarProfile } from "@/components/bursar/bursar-profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function TestBursarProfileContent() {
  const { user, login } = useAuth()
  const { profile } = useProfile()
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
    role: "bursar"
  })

  const handleBursarLogin = async () => {
    if (!credentials.identifier || !credentials.password) {
      alert("Please enter both identifier and password")
      return
    }
    
    await login({
      identifier: credentials.identifier,
      password: credentials.password,
      role: credentials.role
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bursar Profile Test</CardTitle>
          <CardDescription>Test the bursar profile functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Auth Context</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Profile Context</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </div>
          
          {!user ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Bursar Identifier (Email/ID)</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={credentials.identifier}
                  onChange={(e) => setCredentials(prev => ({ ...prev, identifier: e.target.value }))}
                  placeholder="Enter bursar email or ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <Button onClick={handleBursarLogin}>
                Login as Bursar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  ✅ Logged in as: {user.name} ({user.role})
                </p>
                <p className="text-green-700 text-sm">
                  User ID: {user.id} | Profile ID: {profile?.id}
                </p>
              </div>
              
              {profile && profile.role === "bursar" ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800">
                    ✅ Profile loaded successfully for bursar
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800">
                    ❌ Profile not loaded or incorrect role
                  </p>
                  <p className="text-red-700 text-sm">
                    Expected: bursar, Got: {profile?.role || "null"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {user && profile && (
        <Card>
          <CardHeader>
            <CardTitle>BursarProfile Component</CardTitle>
            <CardDescription>Rendering the actual bursar profile component</CardDescription>
          </CardHeader>
          <CardContent>
            <BursarProfile />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function TestBursarProfile() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <TestBursarProfileContent />
      </ProfileProvider>
    </AuthProvider>
  )
}
