import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  SwitchField,
  FormSection,
  FormActions,
} from "darkraise-ui/forms"

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.number().min(0),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isActive: z.boolean(),
})

interface ProductFormProps {
  defaultValues: {
    name: string
    description: string
    category: string
    price: number
    compareAtPrice: number
    sku: string
    stock: number
    isActive: boolean
  }
  categoryOptions: Array<{ label: string; value: string }>
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (values: z.infer<typeof productSchema>) => Promise<void>
  onCancel: () => void
}

export function ProductForm({
  defaultValues,
  categoryOptions,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onChange: productSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
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
        submitLabel={submitLabel}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}
