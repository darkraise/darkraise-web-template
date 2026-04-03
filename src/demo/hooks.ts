import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Product, Order, Category } from "@/demo/types"
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrder,
  updateOrderStatus,
  getCustomers,
  getCustomer,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMessages,
  getMessage,
  markMessageAsRead,
  getAnalytics,
} from "@/demo/store"

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: getProducts })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Product, "id" | "createdAt">) =>
      createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Product, "id" | "createdAt">>
    }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: getOrders })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: getCustomers })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: getCategories })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Category, "id">) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Category, "id">>
    }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useMessages() {
  return useQuery({ queryKey: ["messages"], queryFn: getMessages })
}

export function useMessage(id: string) {
  return useQuery({
    queryKey: ["messages", id],
    queryFn: () => getMessage(id),
    enabled: !!id,
  })
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
    },
  })
}

export function useAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ["analytics", days],
    queryFn: () => getAnalytics(days),
  })
}
