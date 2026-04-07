import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PageHeader } from "darkraise-ui/layout"
import { useProduct, useUpdateProduct, useCategories } from "@/demo/hooks"
import type { Product } from "@/demo/types"
import { ProductForm } from "@/features/products"

export const Route = createFileRoute("/_authenticated/products/$id/edit")({
  component: ProductEditPage,
})

function ProductEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id)
  const updateProduct = useUpdateProduct()
  const { data: categories } = useCategories()

  const categoryOptions = (categories ?? []).map((c) => ({
    label: c.name,
    value: c.name,
  }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        title={`Edit ${product.name}`}
        description="Update product details"
      />
      <ProductForm
        defaultValues={{
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? 0,
          sku: product.sku,
          stock: product.stock,
          isActive: product.status === "active",
        }}
        categoryOptions={categoryOptions}
        submitLabel="Save Changes"
        isSubmitting={updateProduct.isPending}
        onSubmit={async (value) => {
          const status: Product["status"] = value.isActive ? "active" : "draft"
          await updateProduct.mutateAsync({
            id: product.id,
            data: {
              name: value.name,
              description: value.description,
              category: value.category,
              price: value.price,
              compareAtPrice: value.compareAtPrice || undefined,
              sku: value.sku,
              stock: value.stock,
              status,
            },
          })
          navigate({ to: "/products" })
        }}
        onCancel={() => navigate({ to: "/products" })}
      />
    </>
  )
}
