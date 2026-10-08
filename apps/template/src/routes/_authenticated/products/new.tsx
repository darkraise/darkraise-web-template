import { useAppTranslation } from "@/i18n/useAppTranslation"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PageHeader } from "darkraise-ui/layout"
import { useCreateProduct, useCategories } from "@/demo/hooks"
import type { Product } from "@/demo/types"
import { ProductForm } from "@/features/products"

export const Route = createFileRoute("/_authenticated/products/new")({
  component: ProductCreatePage,
})

function ProductCreatePage() {
  const t = useAppTranslation()

  const navigate = useNavigate()
  const createProduct = useCreateProduct()
  const { data: categories } = useCategories()

  const categoryOptions = (categories ?? []).map((c) => ({
    label: c.name,
    value: c.name,
  }))

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("Dashboard"), href: "/" },
          { label: t("Products"), href: "/products" },
          { label: t("New Product") },
        ]}
        title={t("New Product")}
        description={t("Add a new product to your catalog")}
      />
      <ProductForm
        defaultValues={{
          name: "",
          description: "",
          category: "",
          price: 0,
          compareAtPrice: 0,
          sku: "",
          stock: 0,
          isActive: true,
        }}
        categoryOptions={categoryOptions}
        submitLabel={t("Create product")}
        isSubmitting={createProduct.isPending}
        onSubmit={async (value) => {
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
          })
          navigate({ to: "/products" })
        }}
        onCancel={() => navigate({ to: "/products" })}
      />
    </>
  )
}
