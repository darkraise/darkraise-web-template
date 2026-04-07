export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  category: string
  status: "active" | "draft" | "archived"
  stock: number
  sku: string
  image: string
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customer: { id: string; name: string; email: string }
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  shippingAddress: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  status: "active" | "inactive"
}

export interface Message {
  id: string
  from: { name: string; email: string; avatar?: string }
  subject: string
  body: string
  isRead: boolean
  createdAt: string
}

export interface AnalyticsDataPoint {
  date: string
  revenue: number
  orders: number
  visitors: number
  conversion: number
}
