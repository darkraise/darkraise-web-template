import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog"
import { DataTable, ColumnHeader, RowActions } from "@/features/data-table"
import {
  TextField,
  NumberField,
  SelectField,
  FormActions,
} from "@/features/forms"
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
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => <ColumnHeader column={column} title="Slug" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: "productCount",
      header: ({ column }) => <ColumnHeader column={column} title="Products" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
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
            { label: "Edit", onClick: () => openEdit(row.original) },
            {
              label: "Delete",
              onClick: () => deleteCategory.mutate(row.original.id),
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
          { label: "Dashboard", href: "/" },
          { label: "Categories" },
        ]}
        title="Categories"
        description="Organize your product catalog"
        actions={<Button onClick={openCreate}>Add Category</Button>}
      />
      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search categories..."
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
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
            field={field}
            label="Name"
            placeholder="e.g. Electronics"
          />
        )}
      />
      <form.Field
        name="slug"
        children={(field) => (
          <TextField
            field={field}
            label="Slug"
            placeholder="e.g. electronics"
          />
        )}
      />
      <form.Field
        name="productCount"
        children={(field) => (
          <NumberField field={field} label="Product Count" min={0} step={1} />
        )}
      />
      <form.Field
        name="status"
        children={(field) => (
          <SelectField
            field={field}
            label="Status"
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        )}
      />
      <FormActions
        submitLabel={category ? "Save Changes" : "Create Category"}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}
