"use client"

import { useState } from 'react'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { PasswordReset } from './password-reset'
import { Button } from '@/components/ui/button'

type AuthView = 'login' | 'register' | 'reset'

export function AuthPage() {
  const [currentView, setCurrentView] = useState<AuthView>('login')

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <div className="space-y-4">
            <LoginForm />
            <div className="text-center space-y-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => setCurrentView('reset')}
              >
                Forgot your password?
              </Button>
              <div className="text-sm text-muted-foreground">
                Need to create an account?{' '}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => setCurrentView('register')}
                >
                  Contact Administrator
                </Button>
              </div>
            </div>
          </div>
        )
      case 'register':
        return <RegisterForm onBack={() => setCurrentView('login')} />
      case 'reset':
        return <PasswordReset onBack={() => setCurrentView('login')} />
      default:
        return <LoginForm />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {renderView()}
      </div>
    </div>
  )
}
