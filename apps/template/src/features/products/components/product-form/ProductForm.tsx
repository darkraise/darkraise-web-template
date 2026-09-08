import { useAppTranslation } from "@/i18n/useAppTranslation"
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
import { fieldProps } from "@/lib/field-props"
import { productSchema } from "./schema"

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
  const t = useAppTranslation()

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
      <FormSection title={t("Basic Information")}>
        <form.Field
          name="name"
          children={(field) => (
            <TextField
              {...fieldProps<string>(field, t)}
              label={t("Product Name")}
              placeholder={t("Enter product name")}
            />
          )}
        />
        <form.Field
          name="description"
          children={(field) => (
            <TextareaField
              {...fieldProps<string>(field, t)}
              label={t("Description")}
              placeholder={t("Describe your product")}
              rows={4}
            />
          )}
        />
        <form.Field
          name="category"
          children={(field) => (
            <SelectField
              {...fieldProps<string>(field, t)}
              label={t("Category")}
              placeholder={t("Select a category")}
              options={categoryOptions}
            />
          )}
        />
      </FormSection>

      <FormSection title={t("Pricing")}>
        <form.Field
          name="price"
          children={(field) => (
            <NumberField
              {...fieldProps<number | undefined>(field, t)}
              label={t("Price")}
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
              {...fieldProps<number | undefined>(field, t)}
              label={t("Compare-at Price")}
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          )}
        />
      </FormSection>

      <FormSection title={t("Inventory")}>
        <form.Field
          name="sku"
          children={(field) => (
            <TextField
              {...fieldProps<string>(field, t)}
              label="SKU"
              placeholder="e.g. APL-IP15-256"
            />
          )}
        />
        <form.Field
          name="stock"
          children={(field) => (
            <NumberField
              {...fieldProps<number | undefined>(field, t)}
              label={t("Stock Quantity")}
              placeholder="0"
              min={0}
              step={1}
            />
          )}
        />
      </FormSection>

      <FormSection title={t("Status")}>
        <form.Field
          name="isActive"
          children={(field) => (
            <SwitchField
              {...fieldProps<boolean>(field, t)}
              label={t("Active")}
              description={t("Make this product visible in the store")}
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
