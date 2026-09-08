import { useAppTranslation } from "@/i18n/useAppTranslation"
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "darkraise-ui/layout"
import { Button } from "darkraise-ui/components/button"
import { Badge } from "darkraise-ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "darkraise-ui/components/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "darkraise-ui/components/alert-dialog"
import { DataTable, ColumnHeader, RowActions } from "darkraise-ui/data-table"
import {
  TextField,
  NumberField,
  SelectField,
  FormActions,
} from "darkraise-ui/forms"
import { fieldProps } from "@/lib/field-props"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/demo/hooks"
import type { Category } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
})

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  productCount: z.number().int().min(0),
  status: z.enum(["active", "inactive"]),
})

function CategoriesPage() {
  const t = useAppTranslation()

  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  const openCreate = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Name")} />
      ),
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Slug")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: "productCount",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Products")} />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Status")} />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: t("Edit"), onClick: () => openEdit(row.original) },
            {
              label: t("Delete"),
              onClick: () => setPendingDelete(row.original),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("Dashboard"), href: "/" },
          { label: t("Categories") },
        ]}
        title={t("Categories")}
        description={t("Organize your product catalog")}
        actions={<Button onClick={openCreate}>{t("Add Category")}</Button>}
      />
      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t("Search categories...")}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t("Edit Category") : t("New Category")}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSubmit={async (values) => {
              if (editingCategory) {
                await updateCategory.mutateAsync({
                  id: editingCategory.id,
                  data: values,
                })
              } else {
                await createCategory.mutateAsync(values)
              }
              setDialogOpen(false)
            }}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createCategory.isPending || updateCategory.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete category?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently delete “{{name}}”. Products in this category will not be deleted. This action cannot be undone.",
                { name: pendingDelete?.name ?? "" },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteCategory.mutate(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  category: Category | null
  onSubmit: (values: Omit<Category, "id">) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const t = useAppTranslation()

  const form = useForm({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      productCount: category?.productCount ?? 0,
      status: category?.status ?? ("active" as const),
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value as Omit<Category, "id">)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="name"
        children={(field) => (
          <TextField
            {...fieldProps<string>(field, t)}
            label={t("Name")}
            placeholder={t("e.g. Electronics")}
          />
        )}
      />
      <form.Field
        name="slug"
        children={(field) => (
          <TextField
            {...fieldProps<string>(field, t)}
            label={t("Slug")}
            placeholder={t("e.g. electronics")}
          />
        )}
      />
      <form.Field
        name="productCount"
        children={(field) => (
          <NumberField
            {...fieldProps<number | undefined>(field, t)}
            label={t("Product Count")}
            min={0}
            step={1}
          />
        )}
      />
      <form.Field
        name="status"
        children={(field) => (
          <SelectField
            {...fieldProps<string>(field, t)}
            label={t("Status")}
            options={[
              { label: t("Active"), value: "active" },
              { label: t("Inactive"), value: "inactive" },
            ]}
          />
        )}
      />
      <FormActions
        submitLabel={category ? t("Save Changes") : t("Create Category")}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}
