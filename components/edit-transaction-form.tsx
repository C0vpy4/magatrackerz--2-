"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type Category, type Transaction, getCurrentUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface EditTransactionFormProps {
  transactionId: number
}

export default function EditTransactionForm({ transactionId }: EditTransactionFormProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [type, setType] = useState<"income" | "expense">("expense")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [description, setDescription] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchTransaction() {
      const user = await getCurrentUser()
      if (!user) return

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .single()

      if (data) {
        setTransaction(data)
        setType(data.type)
        setCategoryId(data.category_id.toString())
        setAmount(data.amount.toString())
        setDate(parse(data.date, "yyyy-MM-dd", new Date()))
        setDescription(data.description || "")
      } else {
        // Транзакция не найдена или не принадлежит пользователю
        router.push("/transactions")
      }

      setLoading(false)
    }

    fetchTransaction()
  }, [transactionId, router])

  useEffect(() => {
    async function fetchCategories() {
      const user = await getCurrentUser()
      if (!user) return

      const { data } = await supabase.from("categories").select("*").eq("user_id", user.id).eq("type", type)

      if (data) {
        setCategories(data)
      }
    }

    if (!loading) {
      fetchCategories()
    }
  }, [type, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const user = await getCurrentUser()
      if (!user) throw new Error("Пользователь не авторизован")

      // Проверка на заполнение обязательных полей
      if (!categoryId || !amount || !date) {
        throw new Error("Пожалуйста, заполните все обязательные поля")
      }

      // Обновление транзакции
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          category_id: Number.parseInt(categoryId),
          amount: Number.parseFloat(amount),
          type,
          date: format(date, "yyyy-MM-dd"),
          description,
        })
        .eq("id", transactionId)
        .eq("user_id", user.id)

      if (updateError) throw updateError

      // Перенаправление на страницу транзакций
      router.push("/transactions")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при обновлении транзакции")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-4 border-green-600">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="text-xl">Редактирование транзакции</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">Загрузка...</div>
        </CardContent>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card className="border-4 border-green-600">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="text-xl">Ошибка</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            Транзакция не найдена или у вас нет прав для её редактирования
          </div>
          <div className="text-center">
            <Button onClick={() => router.push("/transactions")} className="bg-green-600 hover:bg-green-700">
              Вернуться к списку транзакций
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className={`${type === "income" ? "bg-green-600" : "bg-red-600"} text-white`}>
        <CardTitle className="text-xl">Редактировать {type === "income" ? "доход" : "расход"}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <RadioGroup
                value={type}
                onValueChange={(value) => setType(value as "income" | "expense")}
                className="flex"
              >
                <div className="flex items-center space-x-2 mr-4">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="text-red-600 font-medium">
                    Расход
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="text-green-600 font-medium">
                    Доход
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
                className={`border-2 ${type === "income" ? "border-green-600" : "border-red-600"}`}
              />
            </div>

            <div className="space-y-2">
              <Label>Дата</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-2 border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd MMMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание транзакции"
                className="border-2 border-gray-300"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <div className="flex space-x-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.push("/transactions")} className="flex-1">
              Отмена
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              disabled={loading}
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
