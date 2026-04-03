import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { PageHeader } from "@/core/layout"
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  SwitchField,
  FormSection,
  FormActions,
} from "@/features/forms"
import { useCreateProduct, useCategories } from "@/demo/hooks"
import type { Product } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/products/new")({
  component: ProductCreatePage,
})

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.number().min(0),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isActive: z.boolean(),
})

function ProductCreatePage() {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()
  const { data: categories } = useCategories()

  const categoryOptions = (categories ?? []).map((c) => ({
    label: c.name,
    value: c.name,
  }))

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: 0,
      compareAtPrice: 0,
      sku: "",
      stock: 0,
      isActive: true,
    },
    validators: {
      onChange: productSchema,
    },
    onSubmit: async ({ value }) => {
      const status: Product["status"] = value.isActive ? "active" : "draft"
      await createProduct.mutateAsync({
        name: value.name,
        description: value.description,
        category: value.category,
        price: value.price,
        compareAtPrice: value.compareAtPrice || undefined,
        sku: value.sku,
        stock: value.stock,
        status,
        image: `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(value.name.slice(0, 6))}`,
      })
      navigate({ to: "/products" })
    },
  })

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Products", href: "/products" },
          { label: "New Product" },
        ]}
        title="New Product"
        description="Add a new product to your catalog"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="max-w-2xl space-y-8"
      >
        <FormSection title="Basic Information">
          <form.Field
            name="name"
            children={(field) => (
              <TextField
                field={field}
                label="Product Name"
                placeholder="Enter product name"
              />
            )}
          />
          <form.Field
            name="description"
            children={(field) => (
              <TextareaField
                field={field}
                label="Description"
                placeholder="Describe your product"
                rows={4}
              />
            )}
          />
          <form.Field
            name="category"
            children={(field) => (
              <SelectField
                field={field}
                label="Category"
                placeholder="Select a category"
                options={categoryOptions}
              />
            )}
          />
        </FormSection>

        <FormSection title="Pricing">
          <form.Field
            name="price"
            children={(field) => (
              <NumberField
                field={field}
                label="Price"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            )}
          />
          <form.Field
            name="compareAtPrice"
            children={(field) => (
              <NumberField
                field={field}
                label="Compare-at Price"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            )}
          />
        </FormSection>

        <FormSection title="Inventory">
          <form.Field
            name="sku"
            children={(field) => (
              <TextField
                field={field}
                label="SKU"
                placeholder="e.g. APL-IP15-256"
              />
            )}
          />
          <form.Field
            name="stock"
            children={(field) => (
              <NumberField
                field={field}
                label="Stock Quantity"
                placeholder="0"
                min={0}
                step={1}
              />
            )}
          />
        </FormSection>

        <FormSection title="Status">
          <form.Field
            name="isActive"
            children={(field) => (
              <SwitchField
                field={field}
                label="Active"
                description="Make this product visible in the store"
              />
            )}
          />
        </FormSection>

        <FormActions
          submitLabel="Create Product"
          onCancel={() => navigate({ to: "/products" })}
          isSubmitting={createProduct.isPending}
          canSubmit={form.state.canSubmit}
        />
      </form>
    </>
  )
}
