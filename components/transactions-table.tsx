"use client"

import { useState, useEffect } from "react"
import { supabase, type Transaction, type Category, getCurrentUser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  const [type, setType] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [month, type, categoryId])

  async function fetchTransactions() {
    setLoading(true)
    const user = await getCurrentUser()
    if (!user) return

    // Создаем базовый запрос
    let query = supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    // Добавляем фильтр по месяцу
    if (month) {
      const startDate = `${month}-01`
      const endDate = new Date(Number.parseInt(month.split("-")[0]), Number.parseInt(month.split("-")[1]), 0)
        .toISOString()
        .substring(0, 10)

      query = query.gte("date", startDate).lte("date", endDate)
    }

    // Добавляем фильтр по типу
    if (type !== "all") {
      query = query.eq("type", type)
    }

    // Добавляем фильтр по категории
    if (categoryId !== "all") {
      query = query.eq("category_id", categoryId)
    }

    // Выполняем запрос
    const { data } = await query

    if (data) {
      setTransactions(data)
    }

    setLoading(false)
  }

  async function fetchCategories() {
    const user = await getCurrentUser()
    if (!user) return

    const { data } = await supabase.from("categories").select("*").eq("user_id", user.id).order("name")

    if (data) {
      setCategories(data)
    }
  }

  const handleDeleteTransaction = async () => {
    setError(null)

    if (!selectedTransaction) return

    try {
      const { error: deleteError } = await supabase.from("transactions").delete().eq("id", selectedTransaction.id)

      if (deleteError) throw deleteError

      setSelectedTransaction(null)
      setIsDeleteDialogOpen(false)
      fetchTransactions()
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при удалении транзакции")
    }
  }

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }

  // Форматирование числа в рубли
  const formatCurrency = (amount: number, type: string) => {
    const prefix = type === "expense" ? "-" : "+"
    return (
      prefix +
      new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
      })
        .format(Math.abs(amount))
        .replace("₽", "₽")
    )
  }

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Генерация списка месяцев для фильтра
  const getMonthOptions = () => {
    const options = []
    const currentDate = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = date.toISOString().substring(0, 7)
      const label = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date)

      options.push({ value, label })
    }

    return options
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Транзакции</CardTitle>
        <Link href="/transactions/add">
          <Button variant="outline" size="sm" className="text-white border-white hover:bg-green-700">
            <PlusCircle className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="month-filter">Месяц</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month-filter">
                <SelectValue placeholder="Выберите месяц" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-filter">Тип</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-filter">Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Таблица транзакций */}
        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Нет транзакций за выбранный период</p>
            <Link href="/transactions/add">
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                <PlusCircle className="h-4 w-4 mr-1" />
                Добавить транзакцию
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Дата</th>
                  <th className="text-left py-2 px-4">Категория</th>
                  <th className="text-left py-2 px-4">Сумма</th>
                  <th className="text-left py-2 px-4">Описание</th>
                  <th className="text-right py-2 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{formatDate(transaction.date)}</td>
                    <td className="py-2 px-4">{transaction.category?.name || "Без категории"}</td>
                    <td
                      className={`py-2 px-4 font-medium ${
                        transaction.type === "expense" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(transaction.amount, transaction.type)}
                    </td>
                    <td className="py-2 px-4">{transaction.description || "-"}</td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/transactions/edit/${transaction.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(transaction)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Диалог удаления транзакции */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить транзакцию</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Вы уверены, что хотите удалить эту транзакцию?</p>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleDeleteTransaction} variant="destructive">
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
