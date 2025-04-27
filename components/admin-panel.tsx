"use client"

import { useState, useEffect } from "react"
import { supabase, getCurrentUser, getUserRole } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminAccess() {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/dashboard")
        return
      }

      const role = await getUserRole(user.id)
      setUserRole(role)

      if (role !== "admin") {
        router.push("/dashboard")
        return
      }

      fetchUsers()
      fetchRoles()
    }

    checkAdminAccess()
  }, [router])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, roles(name)")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRoles() {
    try {
      const { data, error } = await supabase.from("roles").select("*").order("id")

      if (error) throw error
      setRoles(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      const { error } = await supabase.from("users").update({ role_id: roleId }).eq("id", userId)

      if (error) throw error

      // Обновляем список пользователей
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const exportUserDataToCSV = async (userId: number) => {
    try {
      // Получаем данные пользователя
      const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

      // Получаем транзакции пользователя
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*, category:categories(name)")
        .eq("user_id", userId)
        .order("date", { ascending: false })

      if (!transactions || transactions.length === 0) {
        alert("У пользователя нет транзакций для экспорта")
        return
      }

      // Форматируем данные для CSV
      const headers = ["Дата", "Тип", "Категория", "Сумма", "Описание"]

      const rows = transactions.map((t: any) => [
        t.date,
        t.type === "income" ? "Доход" : "Расход",
        t.category?.name || "Без категории",
        t.amount,
        t.description || "",
      ])

      // Создаем CSV строку
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      // Создаем и скачиваем файл
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `transactions_${userData?.email || userId}_${new Date().toISOString().split("T")[0]}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <Card className="border-4 border-green-600">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="text-xl">Панель администратора</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">Загрузка...</div>
        </CardContent>
      </Card>
    )
  }

  if (userRole !== "admin") {
    return (
      <Card className="border-4 border-green-600">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="text-xl">Доступ запрещен</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">У вас нет прав для доступа к этой странице</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white">
        <CardTitle className="text-xl flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Панель администратора
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="users">
          <TabsList className="grid grid-cols-1 mb-4">
            <TabsTrigger value="users">Пользователи</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">ID</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Роль</th>
                    <th className="text-left py-2 px-4">Дата регистрации</th>
                    <th className="text-right py-2 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{user.id}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">
                        <Select
                          value={user.role_id.toString()}
                          onValueChange={(value) => handleRoleChange(user.id, Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Роль" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-4">{new Date(user.created_at).toLocaleDateString("ru-RU")}</td>
                      <td className="py-2 px-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => exportUserDataToCSV(user.id)}>
                          <Download className="h-4 w-4 mr-1" />
                          Экспорт
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
