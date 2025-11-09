import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"
import "react-initials-avatar/lib/ReactInitialsAvatar.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pison School Management System",
  description: "Comprehensive school management system for Pison Academy of Excellence",
    generator: 'Cyrille Kuete',
    icons: {
      icon: '/pison-logo.png',
      shortcut: '/pison-logo.png',
      apple: '/pison-logo.png'
    }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
