import type {
  Product,
  Order,
  Customer,
  Category,
  Message,
  AnalyticsDataPoint,
} from "@/demo/types"
import { products as initialProducts } from "@/demo/data/products"
import { orders as initialOrders } from "@/demo/data/orders"
import { customers as initialCustomers } from "@/demo/data/customers"
import { categories as initialCategories } from "@/demo/data/categories"
import { messages as initialMessages } from "@/demo/data/messages"
import { analytics as initialAnalytics } from "@/demo/data/analytics"

let productsData = [...initialProducts]
const ordersData = [...initialOrders]
const customersData = [...initialCustomers]
let categoriesData = [...initialCategories]
const messagesData = [...initialMessages]
const analyticsData = [...initialAnalytics]

function delay(): Promise<void> {
  const ms = 200 + Math.random() * 300
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getProducts(): Promise<Product[]> {
  await delay()
  return [...productsData]
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await delay()
  return productsData.find((p) => p.id === id)
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt">,
): Promise<Product> {
  await delay()
  const product: Product = {
    ...data,
    id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  productsData = [product, ...productsData]
  return product
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>,
): Promise<Product> {
  await delay()
  const index = productsData.findIndex((p) => p.id === id)
  if (index === -1) throw new Error(`Product ${id} not found`)
  const updated = { ...productsData[index], ...data } as Product
  productsData[index] = updated
  return updated
}

export async function deleteProduct(id: string): Promise<void> {
  await delay()
  productsData = productsData.filter((p) => p.id !== id)
}

export async function getOrders(): Promise<Order[]> {
  await delay()
  return [...ordersData]
}

export async function getOrder(id: string): Promise<Order | undefined> {
  await delay()
  return ordersData.find((o) => o.id === id)
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<Order> {
  await delay()
  const index = ordersData.findIndex((o) => o.id === id)
  if (index === -1) throw new Error(`Order ${id} not found`)
  const updated = { ...ordersData[index], status } as Order
  ordersData[index] = updated
  return updated
}

export async function getCustomers(): Promise<Customer[]> {
  await delay()
  return [...customersData]
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  await delay()
  return customersData.find((c) => c.id === id)
}

export async function getCategories(): Promise<Category[]> {
  await delay()
  return [...categoriesData]
}

export async function createCategory(
  data: Omit<Category, "id">,
): Promise<Category> {
  await delay()
  const category: Category = {
    ...data,
    id: `cat-${Date.now()}`,
  }
  categoriesData = [category, ...categoriesData]
  return category
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id">>,
): Promise<Category> {
  await delay()
  const index = categoriesData.findIndex((c) => c.id === id)
  if (index === -1) throw new Error(`Category ${id} not found`)
  const updated = { ...categoriesData[index], ...data } as Category
  categoriesData[index] = updated
  return updated
}

export async function deleteCategory(id: string): Promise<void> {
  await delay()
  categoriesData = categoriesData.filter((c) => c.id !== id)
}

export async function getMessages(): Promise<Message[]> {
  await delay()
  return [...messagesData]
}

export async function getMessage(id: string): Promise<Message | undefined> {
  await delay()
  return messagesData.find((m) => m.id === id)
}

export async function markMessageAsRead(id: string): Promise<Message> {
  await delay()
  const index = messagesData.findIndex((m) => m.id === id)
  if (index === -1) throw new Error(`Message ${id} not found`)
  const updated = { ...messagesData[index], isRead: true } as Message
  messagesData[index] = updated
  return updated
}

export async function getAnalytics(
  days: number = 30,
): Promise<AnalyticsDataPoint[]> {
  await delay()
  return analyticsData.slice(-days)
}
