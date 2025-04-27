import type React from "react"
import Navbar from "@/components/navbar"
import AuthCheck from "@/components/auth-check"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </AuthCheck>
  )
}
