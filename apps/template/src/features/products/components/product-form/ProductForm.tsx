import { useId } from "react"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  FormSection,
  FormActions,
} from "darkraise-ui/forms"
import { Card, CardContent } from "darkraise-ui/components/card"
import { Label } from "darkraise-ui/components/label"
import { Switch } from "darkraise-ui/components/switch"
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
  const activeId = useId()

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
        <Card>
          <CardContent className="space-y-4 pt-6">
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
          </CardContent>
        </Card>
      </FormSection>

      <FormSection title={t("Pricing")}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </CardContent>
        </Card>
      </FormSection>

      <FormSection title={t("Inventory")}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </CardContent>
        </Card>
      </FormSection>

      <FormSection title={t("Status")}>
        <Card>
          <CardContent className="pt-6">
            <form.Field
              name="isActive"
              children={(field) => (
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor={activeId}>{t("Active")}</Label>
                    <p
                      id={`${activeId}-description`}
                      className="text-muted-foreground text-sm"
                    >
                      {t("Make this product visible in the store")}
                    </p>
                  </div>
                  <Switch
                    id={activeId}
                    aria-describedby={`${activeId}-description`}
                    onBlur={field.handleBlur}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            />
          </CardContent>
        </Card>
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
