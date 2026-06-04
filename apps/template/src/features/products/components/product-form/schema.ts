import { z } from "zod"

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
