"use client"

import { useState, useEffect } from "react"
import { supabase, type Category, getCurrentUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("expense")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [activeTab])

  async function fetchCategories() {
    setLoading(true)
    const user = await getCurrentUser()
    if (!user) return

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", activeTab)
      .order("name")

    if (data) {
      setCategories(data)
    }

    setLoading(false)
  }

  const handleAddCategory = async () => {
    setError(null)

    if (!newCategoryName.trim()) {
      setError("Название категории не может быть пустым")
      return
    }

    try {
      const user = await getCurrentUser()
      if (!user) throw new Error("Пользователь не авторизован")

      const { error: insertError } = await supabase.from("categories").insert([
        {
          user_id: user.id,
          name: newCategoryName.trim(),
          type: newCategoryType,
        },
      ])

      if (insertError) throw insertError

      setNewCategoryName("")
      setIsAddDialogOpen(false)
      fetchCategories()
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при добавлении категории")
    }
  }

  const handleEditCategory = async () => {
    setError(null)

    if (!selectedCategory || !newCategoryName.trim()) {
      setError("Название категории не может быть пустым")
      return
    }

    try {
      const { error: updateError } = await supabase
        .from("categories")
        .update({ name: newCategoryName.trim() })
        .eq("id", selectedCategory.id)

      if (updateError) throw updateError

      setNewCategoryName("")
      setSelectedCategory(null)
      setIsEditDialogOpen(false)
      fetchCategories()
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при редактировании категории")
    }
  }

  const handleDeleteCategory = async () => {
    setError(null)

    if (!selectedCategory) return

    try {
      // Проверяем, есть ли транзакции с этой категорией
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id")
        .eq("category_id", selectedCategory.id)
        .limit(1)

      if (transactions && transactions.length > 0) {
        throw new Error("Нельзя удалить категорию, которая используется в транзакциях")
      }

      // Проверяем, есть ли бюджеты с этой категорией
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id")
        .eq("category_id", selectedCategory.id)
        .limit(1)

      if (budgets && budgets.length > 0) {
        throw new Error("Нельзя удалить категорию, которая используется в бюджетах")
      }

      const { error: deleteError } = await supabase.from("categories").delete().eq("id", selectedCategory.id)

      if (deleteError) throw deleteError

      setSelectedCategory(null)
      setIsDeleteDialogOpen(false)
      fetchCategories()
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при удалении категории")
    }
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setNewCategoryName(category.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <Card className="border-4 border-green-600">
      <CardHeader className="bg-green-600 text-white flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Управление категориями</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="text-white border-white hover:bg-green-700"
          onClick={() => {
            setNewCategoryType(activeTab as "income" | "expense")
            setNewCategoryName("")
            setError(null)
            setIsAddDialogOpen(true)
          }}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="expense">Расходы</TabsTrigger>
            <TabsTrigger value="income">Доходы</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-4">
            {loading ? (
              <div className="text-center">Загрузка...</div>
            ) : categories.length === 0 ? (
              <div className="text-center text-gray-500">Нет категорий расходов</div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                    <span>{category.name}</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(category)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            {loading ? (
              <div className="text-center">Загрузка...</div>
            ) : categories.length === 0 ? (
              <div className="text-center text-gray-500">Нет категорий доходов</div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                    <span>{category.name}</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(category)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Диалог добавления категории */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить категорию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <RadioGroup
                value={newCategoryType}
                onValueChange={(value) => setNewCategoryType(value as "income" | "expense")}
                className="flex"
              >
                <div className="flex items-center space-x-2 mr-4">
                  <RadioGroupItem value="expense" id="new-expense" />
                  <Label htmlFor="new-expense" className="text-red-600 font-medium">
                    Расход
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="new-income" />
                  <Label htmlFor="new-income" className="text-green-600 font-medium">
                    Доход
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-name">Название</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Введите название категории"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddCategory} className="bg-green-600 hover:bg-green-700">
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования категории */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Название</Label>
              <Input
                id="edit-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Введите название категории"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditCategory} className="bg-green-600 hover:bg-green-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления категории */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить категорию</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Вы уверены, что хотите удалить категорию "{selectedCategory?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">
              Категорию можно удалить только если она не используется в транзакциях или бюджетах.
            </p>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleDeleteCategory} variant="destructive">
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
