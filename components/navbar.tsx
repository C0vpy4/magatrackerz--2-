"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, ListOrdered, PlusCircle, PieChart, Settings, Users } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Получаем данные пользователя из localStorage
    const email = localStorage.getItem("user_email")
    const roleId = localStorage.getItem("user_role_id")

    setUserEmail(email)

    // Определяем роль пользователя
    if (roleId === "2") {
      setUserRole("admin")
    } else {
      setUserRole("user")
    }
  }, [])

  const handleSignOut = () => {
    // Удаляем данные пользователя из localStorage
    localStorage.removeItem("user_email")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role_id")
    localStorage.removeItem("is_authenticated")

    // Удаляем cookie
    document.cookie = "is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Перенаправляем на страницу входа
    router.push("/")
  }

  const navItems = [
    { name: "Главная", href: "/dashboard", icon: Home },
    { name: "Транзакции", href: "/transactions", icon: ListOrdered },
    { name: "Добавить", href: "/transactions/add", icon: PlusCircle },
    { name: "Бюджеты", href: "/budgets", icon: PieChart },
    { name: "Категории", href: "/categories", icon: Settings },
  ]

  // Добавляем пункт меню для администратора
  if (userRole === "admin") {
    navItems.push({ name: "Администрирование", href: "/admin", icon: Users })
  }

  return (
    <nav className="bg-green-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">МАГАtrackerz</span>
            </div>
          </div>

          {/* Десктопное меню */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    pathname === item.href ? "bg-green-700 text-white" : "text-white hover:bg-green-500"
                  }`}
                >
                  <Icon className="mr-1 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
            <Button variant="outline" onClick={handleSignOut} className="text-white border-white hover:bg-green-700">
              Выйти ({userEmail})
            </Button>
          </div>

          {/* Мобильное меню */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-500 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню, показывается/скрывается на основе состояния */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                    pathname === item.href ? "bg-green-700 text-white" : "text-white hover:bg-green-500"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full mt-2 text-white border-white hover:bg-green-700"
            >
              Выйти
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
