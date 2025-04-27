import AuthForm from "@/components/auth-form"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </main>
  )
}
