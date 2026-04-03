# Sample E-Commerce Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive e-commerce admin demo that exercises every feature module in the web template through realistic pages with mock data.

**Architecture:** All demo code lives in `src/demo/` (types, mock data, async store, TanStack Query hooks). Route pages in `src/routes/` consume demo hooks and render using existing core layout and feature module components. No changes to core or feature module source files.

**Tech Stack:** React, TypeScript strict, TanStack Router (file-based), TanStack Query, TanStack Form + Zod, Zustand, shadcn/ui, Tailwind CSS v3, Recharts, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-04-sample-ecommerce-admin-design.md`

---

## File Structure

```
src/demo/
├── data/
│   ├── products.ts
│   ├── orders.ts
│   ├── customers.ts
│   ├── categories.ts
│   ├── messages.ts
│   └── analytics.ts
├── store.ts
├── types.ts
└── hooks.ts

src/routes/
├── _authenticated.tsx                 — MODIFY (update nav groups)
├── _authenticated/
│   ├── index.tsx                      — REPLACE (dashboard)
│   ├── analytics.tsx                  — CREATE
│   ├── products/
│   │   ├── index.tsx                  — CREATE
│   │   ├── new.tsx                    — CREATE
│   │   └── $id/
│   │       └── edit.tsx               — CREATE
│   ├── categories.tsx                 — CREATE
│   ├── orders/
│   │   ├── index.tsx                  — CREATE
│   │   └── $id.tsx                    — CREATE
│   ├── customers/
│   │   ├── index.tsx                  — CREATE
│   │   └── $id.tsx                    — CREATE
│   └── settings.tsx                   — REPLACE (tabbed settings)
├── _inbox.tsx                         — CREATE
└── _inbox/
    └── inbox.tsx                      — CREATE
```

---

## Task 1: Demo types

**Files:**

- Create: `src/demo/types.ts`

- [ ] **Step 1: Create `src/demo/types.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/demo/types.ts
git commit -m "feat(demo): add entity type definitions"
```

---

## Task 2: Mock data

**Files:**

- Create: `src/demo/data/products.ts`, `src/demo/data/orders.ts`, `src/demo/data/customers.ts`, `src/demo/data/categories.ts`, `src/demo/data/messages.ts`, `src/demo/data/analytics.ts`

- [ ] **Step 1: Create `src/demo/data/categories.ts`**

```typescript
import type { Category } from "@/demo/types"

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Smartphones",
    slug: "smartphones",
    productCount: 4,
    status: "active",
  },
  {
    id: "cat-2",
    name: "Laptops",
    slug: "laptops",
    productCount: 3,
    status: "active",
  },
  {
    id: "cat-3",
    name: "Audio",
    slug: "audio",
    productCount: 3,
    status: "active",
  },
  {
    id: "cat-4",
    name: "Wearables",
    slug: "wearables",
    productCount: 2,
    status: "active",
  },
  {
    id: "cat-5",
    name: "Clothing",
    slug: "clothing",
    productCount: 3,
    status: "active",
  },
  {
    id: "cat-6",
    name: "Footwear",
    slug: "footwear",
    productCount: 2,
    status: "active",
  },
  {
    id: "cat-7",
    name: "Accessories",
    slug: "accessories",
    productCount: 2,
    status: "active",
  },
  {
    id: "cat-8",
    name: "Home & Garden",
    slug: "home-garden",
    productCount: 1,
    status: "inactive",
  },
]
```

- [ ] **Step 2: Create `src/demo/data/products.ts`**

```typescript
import type { Product } from "@/demo/types"

export const products: Product[] = [
  {
    id: "prod-1",
    name: "iPhone 15 Pro",
    description:
      "Apple's flagship smartphone with A17 Pro chip, titanium design, and advanced camera system.",
    price: 999,
    compareAtPrice: 1099,
    category: "Smartphones",
    status: "active",
    stock: 142,
    sku: "APL-IP15P-256",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=iPhone",
    createdAt: "2025-12-01T10:00:00Z",
  },
  {
    id: "prod-2",
    name: "Samsung Galaxy S24 Ultra",
    description:
      "Premium Android phone with S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor.",
    price: 1199,
    compareAtPrice: 1299,
    category: "Smartphones",
    status: "active",
    stock: 89,
    sku: "SAM-GS24U-256",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Galaxy",
    createdAt: "2025-12-05T14:30:00Z",
  },
  {
    id: "prod-3",
    name: "Google Pixel 9 Pro",
    description:
      "Google's AI-powered smartphone with Tensor G4 chip and exceptional computational photography.",
    price: 899,
    category: "Smartphones",
    status: "active",
    stock: 67,
    sku: "GOO-PX9P-128",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Pixel",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: "prod-4",
    name: "OnePlus 12",
    description:
      "Flagship killer with Snapdragon 8 Gen 3, Hasselblad camera, and 100W fast charging.",
    price: 699,
    compareAtPrice: 799,
    category: "Smartphones",
    status: "draft",
    stock: 0,
    sku: "OPL-OP12-256",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=OnePlus",
    createdAt: "2025-12-12T11:00:00Z",
  },
  {
    id: "prod-5",
    name: 'MacBook Pro 16"',
    description:
      "Apple silicon M3 Max laptop with Liquid Retina XDR display and up to 40 GPU cores.",
    price: 2499,
    category: "Laptops",
    status: "active",
    stock: 34,
    sku: "APL-MBP16-512",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=MacBook",
    createdAt: "2025-11-20T08:00:00Z",
  },
  {
    id: "prod-6",
    name: "ThinkPad X1 Carbon Gen 12",
    description:
      "Ultra-lightweight business laptop with Intel Core Ultra processor and 14-inch 2.8K OLED display.",
    price: 1649,
    compareAtPrice: 1849,
    category: "Laptops",
    status: "active",
    stock: 52,
    sku: "LEN-X1C12-512",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=ThinkPad",
    createdAt: "2025-11-25T16:45:00Z",
  },
  {
    id: "prod-7",
    name: "Dell XPS 15",
    description:
      "Premium creative laptop with InfinityEdge display and Intel Core i9 processor.",
    price: 1899,
    category: "Laptops",
    status: "archived",
    stock: 8,
    sku: "DEL-XPS15-1TB",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=XPS",
    createdAt: "2025-10-15T12:00:00Z",
  },
  {
    id: "prod-8",
    name: "Sony WH-1000XM5",
    description:
      "Industry-leading noise cancelling headphones with 30-hour battery and multipoint connection.",
    price: 349,
    compareAtPrice: 399,
    category: "Audio",
    status: "active",
    stock: 210,
    sku: "SNY-WH1KXM5-B",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Sony",
    createdAt: "2025-11-01T10:00:00Z",
  },
  {
    id: "prod-9",
    name: "AirPods Pro 2",
    description:
      "Apple wireless earbuds with adaptive transparency, personalized spatial audio, and USB-C.",
    price: 249,
    category: "Audio",
    status: "active",
    stock: 384,
    sku: "APL-APP2-USBC",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=AirPods",
    createdAt: "2025-11-05T13:30:00Z",
  },
  {
    id: "prod-10",
    name: "Bose QuietComfort Ultra",
    description:
      "Premium noise cancelling earbuds with immersive audio and CustomTune technology.",
    price: 299,
    category: "Audio",
    status: "active",
    stock: 156,
    sku: "BSE-QCULT-BLK",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Bose",
    createdAt: "2025-11-10T09:00:00Z",
  },
  {
    id: "prod-11",
    name: "Apple Watch Ultra 2",
    description:
      "Rugged titanium smartwatch with precision GPS, 36-hour battery, and dive computer.",
    price: 799,
    category: "Wearables",
    status: "active",
    stock: 73,
    sku: "APL-AWU2-49MM",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Watch",
    createdAt: "2025-11-15T10:00:00Z",
  },
  {
    id: "prod-12",
    name: "Samsung Galaxy Watch 6",
    description:
      "Advanced health monitoring smartwatch with BioActive sensor and sleep coaching.",
    price: 329,
    compareAtPrice: 399,
    category: "Wearables",
    status: "active",
    stock: 195,
    sku: "SAM-GW6-44MM",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=GWatch",
    createdAt: "2025-11-18T14:00:00Z",
  },
  {
    id: "prod-13",
    name: "Patagonia Better Sweater",
    description:
      "Classic fleece jacket made from 100% recycled polyester with Fair Trade certification.",
    price: 139,
    category: "Clothing",
    status: "active",
    stock: 320,
    sku: "PAT-BTSW-M-NVY",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Fleece",
    createdAt: "2025-10-01T08:00:00Z",
  },
  {
    id: "prod-14",
    name: "Levi's 501 Original Jeans",
    description:
      "Iconic straight-fit denim jeans with signature button fly and durable construction.",
    price: 89,
    compareAtPrice: 98,
    category: "Clothing",
    status: "active",
    stock: 456,
    sku: "LEV-501-32-BLU",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Levis",
    createdAt: "2025-10-05T11:00:00Z",
  },
  {
    id: "prod-15",
    name: "North Face Nuptse Jacket",
    description:
      "Legendary insulated puffer jacket with 700-fill goose down and water-resistant finish.",
    price: 320,
    category: "Clothing",
    status: "draft",
    stock: 0,
    sku: "TNF-NUPT-L-BLK",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Nuptse",
    createdAt: "2025-10-10T15:30:00Z",
  },
  {
    id: "prod-16",
    name: "Nike Air Max 90",
    description:
      "Iconic sneaker with visible Air cushioning, mesh and leather upper, and waffle outsole.",
    price: 130,
    category: "Footwear",
    status: "active",
    stock: 278,
    sku: "NKE-AM90-10-WHT",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Nike",
    createdAt: "2025-09-20T10:00:00Z",
  },
  {
    id: "prod-17",
    name: "Adidas Ultraboost Light",
    description:
      "Responsive running shoe with Light BOOST midsole and Continental rubber outsole.",
    price: 190,
    compareAtPrice: 210,
    category: "Footwear",
    status: "active",
    stock: 189,
    sku: "ADI-UBL-11-BLK",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Adidas",
    createdAt: "2025-09-25T14:00:00Z",
  },
  {
    id: "prod-18",
    name: "Ray-Ban Wayfarer Classic",
    description:
      "Timeless sunglasses with acetate frame, G-15 green lenses, and UV protection.",
    price: 163,
    category: "Accessories",
    status: "active",
    stock: 534,
    sku: "RBN-WF-CLS-BLK",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=RayBan",
    createdAt: "2025-09-15T09:00:00Z",
  },
  {
    id: "prod-19",
    name: "Herschel Retreat Backpack",
    description:
      "Classic backpack with padded laptop sleeve, magnetic strap closures, and front pocket.",
    price: 89,
    compareAtPrice: 109,
    category: "Accessories",
    status: "active",
    stock: 167,
    sku: "HER-RETR-BLK",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Herschel",
    createdAt: "2025-09-18T11:30:00Z",
  },
  {
    id: "prod-20",
    name: "Dyson V15 Detect",
    description:
      "Cordless vacuum cleaner with laser dust detection and piezo sensor particle counting.",
    price: 749,
    category: "Home & Garden",
    status: "archived",
    stock: 12,
    sku: "DYS-V15D-ABS",
    image: "https://placehold.co/80x80/e2e8f0/64748b?text=Dyson",
    createdAt: "2025-08-01T10:00:00Z",
  },
]
```

- [ ] **Step 3: Create `src/demo/data/customers.ts`**

```typescript
import type { Customer } from "@/demo/types"

export const customers: Customer[] = [
  {
    id: "cust-1",
    name: "Emma Thompson",
    email: "emma.thompson@example.com",
    phone: "+1 (555) 234-5678",
    totalOrders: 12,
    totalSpent: 4280,
    createdAt: "2024-06-15T10:00:00Z",
  },
  {
    id: "cust-2",
    name: "James Chen",
    email: "james.chen@example.com",
    phone: "+1 (555) 345-6789",
    totalOrders: 8,
    totalSpent: 3150,
    createdAt: "2024-07-20T14:30:00Z",
  },
  {
    id: "cust-3",
    name: "Sofia Rodriguez",
    email: "sofia.rodriguez@example.com",
    phone: "+1 (555) 456-7890",
    totalOrders: 15,
    totalSpent: 6720,
    createdAt: "2024-05-01T09:00:00Z",
  },
  {
    id: "cust-4",
    name: "Michael Park",
    email: "michael.park@example.com",
    totalOrders: 3,
    totalSpent: 890,
    createdAt: "2025-01-10T11:00:00Z",
  },
  {
    id: "cust-5",
    name: "Olivia Martinez",
    email: "olivia.martinez@example.com",
    phone: "+1 (555) 567-8901",
    totalOrders: 22,
    totalSpent: 9450,
    createdAt: "2024-03-12T08:00:00Z",
  },
  {
    id: "cust-6",
    name: "William Davis",
    email: "william.davis@example.com",
    totalOrders: 6,
    totalSpent: 2340,
    createdAt: "2024-08-05T16:00:00Z",
  },
  {
    id: "cust-7",
    name: "Ava Wilson",
    email: "ava.wilson@example.com",
    phone: "+1 (555) 678-9012",
    totalOrders: 9,
    totalSpent: 3890,
    createdAt: "2024-09-22T13:00:00Z",
  },
  {
    id: "cust-8",
    name: "Daniel Kim",
    email: "daniel.kim@example.com",
    phone: "+1 (555) 789-0123",
    totalOrders: 18,
    totalSpent: 7210,
    createdAt: "2024-04-18T10:30:00Z",
  },
  {
    id: "cust-9",
    name: "Isabella Brown",
    email: "isabella.brown@example.com",
    totalOrders: 4,
    totalSpent: 1560,
    createdAt: "2025-02-01T15:00:00Z",
  },
  {
    id: "cust-10",
    name: "Alexander Johnson",
    email: "alexander.johnson@example.com",
    phone: "+1 (555) 890-1234",
    totalOrders: 11,
    totalSpent: 4890,
    createdAt: "2024-06-30T12:00:00Z",
  },
  {
    id: "cust-11",
    name: "Mia Taylor",
    email: "mia.taylor@example.com",
    phone: "+1 (555) 901-2345",
    totalOrders: 7,
    totalSpent: 2780,
    createdAt: "2024-10-05T09:30:00Z",
  },
  {
    id: "cust-12",
    name: "Ethan Anderson",
    email: "ethan.anderson@example.com",
    totalOrders: 2,
    totalSpent: 650,
    createdAt: "2025-03-15T11:00:00Z",
  },
  {
    id: "cust-13",
    name: "Charlotte Lee",
    email: "charlotte.lee@example.com",
    phone: "+1 (555) 012-3456",
    totalOrders: 14,
    totalSpent: 5670,
    createdAt: "2024-05-20T14:00:00Z",
  },
  {
    id: "cust-14",
    name: "Benjamin White",
    email: "benjamin.white@example.com",
    phone: "+1 (555) 123-4567",
    totalOrders: 10,
    totalSpent: 4120,
    createdAt: "2024-07-08T10:00:00Z",
  },
  {
    id: "cust-15",
    name: "Amelia Harris",
    email: "amelia.harris@example.com",
    totalOrders: 5,
    totalSpent: 1890,
    createdAt: "2024-11-01T08:30:00Z",
  },
  {
    id: "cust-16",
    name: "Lucas Martin",
    email: "lucas.martin@example.com",
    phone: "+1 (555) 234-5679",
    totalOrders: 19,
    totalSpent: 8340,
    createdAt: "2024-02-14T16:00:00Z",
  },
  {
    id: "cust-17",
    name: "Harper Garcia",
    email: "harper.garcia@example.com",
    totalOrders: 1,
    totalSpent: 349,
    createdAt: "2025-03-28T13:00:00Z",
  },
  {
    id: "cust-18",
    name: "Jack Robinson",
    email: "jack.robinson@example.com",
    phone: "+1 (555) 345-6780",
    totalOrders: 13,
    totalSpent: 5230,
    createdAt: "2024-04-25T11:30:00Z",
  },
  {
    id: "cust-19",
    name: "Ella Clark",
    email: "ella.clark@example.com",
    phone: "+1 (555) 456-7891",
    totalOrders: 8,
    totalSpent: 3470,
    createdAt: "2024-08-18T09:00:00Z",
  },
  {
    id: "cust-20",
    name: "Noah Lewis",
    email: "noah.lewis@example.com",
    totalOrders: 6,
    totalSpent: 2150,
    createdAt: "2024-09-10T15:30:00Z",
  },
  {
    id: "cust-21",
    name: "Lily Walker",
    email: "lily.walker@example.com",
    phone: "+1 (555) 567-8902",
    totalOrders: 16,
    totalSpent: 6890,
    createdAt: "2024-03-05T10:00:00Z",
  },
  {
    id: "cust-22",
    name: "Mason Hall",
    email: "mason.hall@example.com",
    totalOrders: 4,
    totalSpent: 1240,
    createdAt: "2025-01-20T14:00:00Z",
  },
  {
    id: "cust-23",
    name: "Grace Allen",
    email: "grace.allen@example.com",
    phone: "+1 (555) 678-9013",
    totalOrders: 11,
    totalSpent: 4560,
    createdAt: "2024-06-12T08:30:00Z",
  },
  {
    id: "cust-24",
    name: "Logan Young",
    email: "logan.young@example.com",
    phone: "+1 (555) 789-0124",
    totalOrders: 7,
    totalSpent: 2890,
    createdAt: "2024-10-28T12:00:00Z",
  },
  {
    id: "cust-25",
    name: "Chloe King",
    email: "chloe.king@example.com",
    totalOrders: 3,
    totalSpent: 970,
    createdAt: "2025-02-18T16:30:00Z",
  },
  {
    id: "cust-26",
    name: "Aiden Wright",
    email: "aiden.wright@example.com",
    phone: "+1 (555) 890-1235",
    totalOrders: 20,
    totalSpent: 8960,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cust-27",
    name: "Zoey Scott",
    email: "zoey.scott@example.com",
    totalOrders: 9,
    totalSpent: 3780,
    createdAt: "2024-07-30T11:00:00Z",
  },
  {
    id: "cust-28",
    name: "Carter Adams",
    email: "carter.adams@example.com",
    phone: "+1 (555) 901-2346",
    totalOrders: 5,
    totalSpent: 1670,
    createdAt: "2024-11-22T13:30:00Z",
  },
  {
    id: "cust-29",
    name: "Penelope Nelson",
    email: "penelope.nelson@example.com",
    phone: "+1 (555) 012-3457",
    totalOrders: 12,
    totalSpent: 5120,
    createdAt: "2024-05-08T09:00:00Z",
  },
  {
    id: "cust-30",
    name: "Sebastian Hill",
    email: "sebastian.hill@example.com",
    totalOrders: 2,
    totalSpent: 478,
    createdAt: "2025-03-01T15:00:00Z",
  },
]
```

- [ ] **Step 4: Create `src/demo/data/orders.ts`**

```typescript
import type { Order } from "@/demo/types"

export const orders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-2025-001",
    customer: {
      id: "cust-1",
      name: "Emma Thompson",
      email: "emma.thompson@example.com",
    },
    items: [
      { productId: "prod-1", name: "iPhone 15 Pro", quantity: 1, price: 999 },
      { productId: "prod-9", name: "AirPods Pro 2", quantity: 1, price: 249 },
    ],
    status: "delivered",
    total: 1248,
    shippingAddress: "123 Oak Street, San Francisco, CA 94102",
    createdAt: "2025-12-15T10:30:00Z",
  },
  {
    id: "ord-2",
    orderNumber: "ORD-2025-002",
    customer: {
      id: "cust-2",
      name: "James Chen",
      email: "james.chen@example.com",
    },
    items: [
      {
        productId: "prod-5",
        name: 'MacBook Pro 16"',
        quantity: 1,
        price: 2499,
      },
    ],
    status: "delivered",
    total: 2499,
    shippingAddress: "456 Pine Avenue, Seattle, WA 98101",
    createdAt: "2025-12-16T14:00:00Z",
  },
  {
    id: "ord-3",
    orderNumber: "ORD-2025-003",
    customer: {
      id: "cust-3",
      name: "Sofia Rodriguez",
      email: "sofia.rodriguez@example.com",
    },
    items: [
      { productId: "prod-8", name: "Sony WH-1000XM5", quantity: 2, price: 349 },
      {
        productId: "prod-18",
        name: "Ray-Ban Wayfarer Classic",
        quantity: 1,
        price: 163,
      },
    ],
    status: "shipped",
    total: 861,
    shippingAddress: "789 Elm Drive, Austin, TX 73301",
    createdAt: "2025-12-18T09:15:00Z",
  },
  {
    id: "ord-4",
    orderNumber: "ORD-2025-004",
    customer: {
      id: "cust-5",
      name: "Olivia Martinez",
      email: "olivia.martinez@example.com",
    },
    items: [
      {
        productId: "prod-13",
        name: "Patagonia Better Sweater",
        quantity: 1,
        price: 139,
      },
      {
        productId: "prod-14",
        name: "Levi's 501 Original Jeans",
        quantity: 2,
        price: 89,
      },
    ],
    status: "delivered",
    total: 317,
    shippingAddress: "321 Maple Lane, Portland, OR 97201",
    createdAt: "2025-12-20T11:45:00Z",
  },
  {
    id: "ord-5",
    orderNumber: "ORD-2025-005",
    customer: {
      id: "cust-8",
      name: "Daniel Kim",
      email: "daniel.kim@example.com",
    },
    items: [
      {
        productId: "prod-2",
        name: "Samsung Galaxy S24 Ultra",
        quantity: 1,
        price: 1199,
      },
      {
        productId: "prod-12",
        name: "Samsung Galaxy Watch 6",
        quantity: 1,
        price: 329,
      },
    ],
    status: "processing",
    total: 1528,
    shippingAddress: "654 Cedar Blvd, Chicago, IL 60601",
    createdAt: "2025-12-22T16:00:00Z",
  },
  {
    id: "ord-6",
    orderNumber: "ORD-2025-006",
    customer: {
      id: "cust-10",
      name: "Alexander Johnson",
      email: "alexander.johnson@example.com",
    },
    items: [
      {
        productId: "prod-16",
        name: "Nike Air Max 90",
        quantity: 1,
        price: 130,
      },
    ],
    status: "delivered",
    total: 130,
    shippingAddress: "987 Birch Road, Denver, CO 80201",
    createdAt: "2025-12-23T08:30:00Z",
  },
  {
    id: "ord-7",
    orderNumber: "ORD-2025-007",
    customer: {
      id: "cust-7",
      name: "Ava Wilson",
      email: "ava.wilson@example.com",
    },
    items: [
      {
        productId: "prod-11",
        name: "Apple Watch Ultra 2",
        quantity: 1,
        price: 799,
      },
    ],
    status: "shipped",
    total: 799,
    shippingAddress: "246 Spruce Way, Boston, MA 02101",
    createdAt: "2025-12-25T12:00:00Z",
  },
  {
    id: "ord-8",
    orderNumber: "ORD-2025-008",
    customer: {
      id: "cust-13",
      name: "Charlotte Lee",
      email: "charlotte.lee@example.com",
    },
    items: [
      {
        productId: "prod-6",
        name: "ThinkPad X1 Carbon Gen 12",
        quantity: 1,
        price: 1649,
      },
      {
        productId: "prod-19",
        name: "Herschel Retreat Backpack",
        quantity: 1,
        price: 89,
      },
    ],
    status: "delivered",
    total: 1738,
    shippingAddress: "135 Willow Court, Miami, FL 33101",
    createdAt: "2025-12-26T10:15:00Z",
  },
  {
    id: "ord-9",
    orderNumber: "ORD-2025-009",
    customer: {
      id: "cust-16",
      name: "Lucas Martin",
      email: "lucas.martin@example.com",
    },
    items: [
      {
        productId: "prod-3",
        name: "Google Pixel 9 Pro",
        quantity: 1,
        price: 899,
      },
    ],
    status: "cancelled",
    total: 899,
    shippingAddress: "468 Ash Street, Nashville, TN 37201",
    createdAt: "2025-12-27T15:30:00Z",
  },
  {
    id: "ord-10",
    orderNumber: "ORD-2025-010",
    customer: {
      id: "cust-14",
      name: "Benjamin White",
      email: "benjamin.white@example.com",
    },
    items: [
      {
        productId: "prod-17",
        name: "Adidas Ultraboost Light",
        quantity: 2,
        price: 190,
      },
      {
        productId: "prod-10",
        name: "Bose QuietComfort Ultra",
        quantity: 1,
        price: 299,
      },
    ],
    status: "delivered",
    total: 679,
    shippingAddress: "579 Poplar Drive, Atlanta, GA 30301",
    createdAt: "2025-12-28T09:00:00Z",
  },
  {
    id: "ord-11",
    orderNumber: "ORD-2025-011",
    customer: {
      id: "cust-21",
      name: "Lily Walker",
      email: "lily.walker@example.com",
    },
    items: [
      { productId: "prod-1", name: "iPhone 15 Pro", quantity: 1, price: 999 },
    ],
    status: "shipped",
    total: 999,
    shippingAddress: "802 Cherry Lane, Phoenix, AZ 85001",
    createdAt: "2025-12-29T13:45:00Z",
  },
  {
    id: "ord-12",
    orderNumber: "ORD-2025-012",
    customer: {
      id: "cust-18",
      name: "Jack Robinson",
      email: "jack.robinson@example.com",
    },
    items: [
      {
        productId: "prod-20",
        name: "Dyson V15 Detect",
        quantity: 1,
        price: 749,
      },
    ],
    status: "pending",
    total: 749,
    shippingAddress: "113 Magnolia Place, Dallas, TX 75201",
    createdAt: "2025-12-30T10:00:00Z",
  },
  {
    id: "ord-13",
    orderNumber: "ORD-2025-013",
    customer: {
      id: "cust-26",
      name: "Aiden Wright",
      email: "aiden.wright@example.com",
    },
    items: [
      {
        productId: "prod-5",
        name: 'MacBook Pro 16"',
        quantity: 1,
        price: 2499,
      },
      { productId: "prod-9", name: "AirPods Pro 2", quantity: 1, price: 249 },
    ],
    status: "delivered",
    total: 2748,
    shippingAddress: "345 Redwood Ave, San Diego, CA 92101",
    createdAt: "2025-12-31T08:00:00Z",
  },
  {
    id: "ord-14",
    orderNumber: "ORD-2025-014",
    customer: {
      id: "cust-6",
      name: "William Davis",
      email: "william.davis@example.com",
    },
    items: [
      { productId: "prod-8", name: "Sony WH-1000XM5", quantity: 1, price: 349 },
    ],
    status: "processing",
    total: 349,
    shippingAddress: "678 Oakwood Blvd, Minneapolis, MN 55401",
    createdAt: "2026-01-02T11:30:00Z",
  },
  {
    id: "ord-15",
    orderNumber: "ORD-2025-015",
    customer: {
      id: "cust-29",
      name: "Penelope Nelson",
      email: "penelope.nelson@example.com",
    },
    items: [
      {
        productId: "prod-13",
        name: "Patagonia Better Sweater",
        quantity: 2,
        price: 139,
      },
    ],
    status: "delivered",
    total: 278,
    shippingAddress: "890 Pinecrest Drive, Charlotte, NC 28201",
    createdAt: "2026-01-03T14:15:00Z",
  },
  {
    id: "ord-16",
    orderNumber: "ORD-2025-016",
    customer: {
      id: "cust-4",
      name: "Michael Park",
      email: "michael.park@example.com",
    },
    items: [
      {
        productId: "prod-2",
        name: "Samsung Galaxy S24 Ultra",
        quantity: 1,
        price: 1199,
      },
    ],
    status: "shipped",
    total: 1199,
    shippingAddress: "234 Sycamore Street, Philadelphia, PA 19101",
    createdAt: "2026-01-05T09:45:00Z",
  },
  {
    id: "ord-17",
    orderNumber: "ORD-2025-017",
    customer: {
      id: "cust-11",
      name: "Mia Taylor",
      email: "mia.taylor@example.com",
    },
    items: [
      {
        productId: "prod-16",
        name: "Nike Air Max 90",
        quantity: 1,
        price: 130,
      },
      {
        productId: "prod-14",
        name: "Levi's 501 Original Jeans",
        quantity: 1,
        price: 89,
      },
    ],
    status: "delivered",
    total: 219,
    shippingAddress: "567 Hawthorn Lane, Sacramento, CA 95801",
    createdAt: "2026-01-06T10:00:00Z",
  },
  {
    id: "ord-18",
    orderNumber: "ORD-2025-018",
    customer: {
      id: "cust-23",
      name: "Grace Allen",
      email: "grace.allen@example.com",
    },
    items: [
      {
        productId: "prod-11",
        name: "Apple Watch Ultra 2",
        quantity: 1,
        price: 799,
      },
      { productId: "prod-1", name: "iPhone 15 Pro", quantity: 1, price: 999 },
    ],
    status: "pending",
    total: 1798,
    shippingAddress: "901 Chestnut Ave, Raleigh, NC 27601",
    createdAt: "2026-01-08T16:00:00Z",
  },
  {
    id: "ord-19",
    orderNumber: "ORD-2025-019",
    customer: {
      id: "cust-15",
      name: "Amelia Harris",
      email: "amelia.harris@example.com",
    },
    items: [
      {
        productId: "prod-18",
        name: "Ray-Ban Wayfarer Classic",
        quantity: 2,
        price: 163,
      },
    ],
    status: "delivered",
    total: 326,
    shippingAddress: "345 Walnut Street, Columbus, OH 43201",
    createdAt: "2026-01-09T12:30:00Z",
  },
  {
    id: "ord-20",
    orderNumber: "ORD-2025-020",
    customer: {
      id: "cust-3",
      name: "Sofia Rodriguez",
      email: "sofia.rodriguez@example.com",
    },
    items: [
      {
        productId: "prod-6",
        name: "ThinkPad X1 Carbon Gen 12",
        quantity: 1,
        price: 1649,
      },
    ],
    status: "processing",
    total: 1649,
    shippingAddress: "789 Elm Drive, Austin, TX 73301",
    createdAt: "2026-01-10T08:15:00Z",
  },
  {
    id: "ord-21",
    orderNumber: "ORD-2025-021",
    customer: {
      id: "cust-19",
      name: "Ella Clark",
      email: "ella.clark@example.com",
    },
    items: [
      {
        productId: "prod-10",
        name: "Bose QuietComfort Ultra",
        quantity: 1,
        price: 299,
      },
    ],
    status: "shipped",
    total: 299,
    shippingAddress: "123 Laurel Blvd, Tampa, FL 33601",
    createdAt: "2026-01-12T10:00:00Z",
  },
  {
    id: "ord-22",
    orderNumber: "ORD-2025-022",
    customer: {
      id: "cust-24",
      name: "Logan Young",
      email: "logan.young@example.com",
    },
    items: [
      {
        productId: "prod-17",
        name: "Adidas Ultraboost Light",
        quantity: 1,
        price: 190,
      },
    ],
    status: "delivered",
    total: 190,
    shippingAddress: "456 Mulberry Way, Indianapolis, IN 46201",
    createdAt: "2026-01-13T14:30:00Z",
  },
  {
    id: "ord-23",
    orderNumber: "ORD-2025-023",
    customer: {
      id: "cust-1",
      name: "Emma Thompson",
      email: "emma.thompson@example.com",
    },
    items: [
      {
        productId: "prod-12",
        name: "Samsung Galaxy Watch 6",
        quantity: 1,
        price: 329,
      },
      {
        productId: "prod-19",
        name: "Herschel Retreat Backpack",
        quantity: 1,
        price: 89,
      },
    ],
    status: "pending",
    total: 418,
    shippingAddress: "123 Oak Street, San Francisco, CA 94102",
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "ord-24",
    orderNumber: "ORD-2025-024",
    customer: {
      id: "cust-27",
      name: "Zoey Scott",
      email: "zoey.scott@example.com",
    },
    items: [
      {
        productId: "prod-3",
        name: "Google Pixel 9 Pro",
        quantity: 1,
        price: 899,
      },
    ],
    status: "cancelled",
    total: 899,
    shippingAddress: "678 Dogwood Place, Pittsburgh, PA 15201",
    createdAt: "2026-01-16T11:00:00Z",
  },
  {
    id: "ord-25",
    orderNumber: "ORD-2025-025",
    customer: {
      id: "cust-8",
      name: "Daniel Kim",
      email: "daniel.kim@example.com",
    },
    items: [
      {
        productId: "prod-5",
        name: 'MacBook Pro 16"',
        quantity: 1,
        price: 2499,
      },
    ],
    status: "delivered",
    total: 2499,
    shippingAddress: "654 Cedar Blvd, Chicago, IL 60601",
    createdAt: "2026-01-18T15:00:00Z",
  },
  {
    id: "ord-26",
    orderNumber: "ORD-2025-026",
    customer: {
      id: "cust-5",
      name: "Olivia Martinez",
      email: "olivia.martinez@example.com",
    },
    items: [
      { productId: "prod-8", name: "Sony WH-1000XM5", quantity: 1, price: 349 },
      {
        productId: "prod-16",
        name: "Nike Air Max 90",
        quantity: 1,
        price: 130,
      },
    ],
    status: "shipped",
    total: 479,
    shippingAddress: "321 Maple Lane, Portland, OR 97201",
    createdAt: "2026-01-19T10:30:00Z",
  },
  {
    id: "ord-27",
    orderNumber: "ORD-2025-027",
    customer: {
      id: "cust-20",
      name: "Noah Lewis",
      email: "noah.lewis@example.com",
    },
    items: [
      {
        productId: "prod-13",
        name: "Patagonia Better Sweater",
        quantity: 1,
        price: 139,
      },
    ],
    status: "delivered",
    total: 139,
    shippingAddress: "890 Ivy Street, Salt Lake City, UT 84101",
    createdAt: "2026-01-20T13:00:00Z",
  },
  {
    id: "ord-28",
    orderNumber: "ORD-2025-028",
    customer: {
      id: "cust-2",
      name: "James Chen",
      email: "james.chen@example.com",
    },
    items: [
      { productId: "prod-1", name: "iPhone 15 Pro", quantity: 2, price: 999 },
    ],
    status: "processing",
    total: 1998,
    shippingAddress: "456 Pine Avenue, Seattle, WA 98101",
    createdAt: "2026-01-22T08:00:00Z",
  },
  {
    id: "ord-29",
    orderNumber: "ORD-2025-029",
    customer: {
      id: "cust-22",
      name: "Mason Hall",
      email: "mason.hall@example.com",
    },
    items: [
      {
        productId: "prod-14",
        name: "Levi's 501 Original Jeans",
        quantity: 3,
        price: 89,
      },
    ],
    status: "shipped",
    total: 267,
    shippingAddress: "234 Foxglove Rd, Kansas City, MO 64101",
    createdAt: "2026-01-23T11:45:00Z",
  },
  {
    id: "ord-30",
    orderNumber: "ORD-2025-030",
    customer: {
      id: "cust-10",
      name: "Alexander Johnson",
      email: "alexander.johnson@example.com",
    },
    items: [
      {
        productId: "prod-2",
        name: "Samsung Galaxy S24 Ultra",
        quantity: 1,
        price: 1199,
      },
      { productId: "prod-9", name: "AirPods Pro 2", quantity: 1, price: 249 },
    ],
    status: "delivered",
    total: 1448,
    shippingAddress: "987 Birch Road, Denver, CO 80201",
    createdAt: "2026-01-25T14:00:00Z",
  },
  {
    id: "ord-31",
    orderNumber: "ORD-2025-031",
    customer: {
      id: "cust-16",
      name: "Lucas Martin",
      email: "lucas.martin@example.com",
    },
    items: [
      {
        productId: "prod-11",
        name: "Apple Watch Ultra 2",
        quantity: 1,
        price: 799,
      },
    ],
    status: "pending",
    total: 799,
    shippingAddress: "468 Ash Street, Nashville, TN 37201",
    createdAt: "2026-01-26T09:30:00Z",
  },
  {
    id: "ord-32",
    orderNumber: "ORD-2025-032",
    customer: {
      id: "cust-7",
      name: "Ava Wilson",
      email: "ava.wilson@example.com",
    },
    items: [
      {
        productId: "prod-6",
        name: "ThinkPad X1 Carbon Gen 12",
        quantity: 1,
        price: 1649,
      },
    ],
    status: "delivered",
    total: 1649,
    shippingAddress: "246 Spruce Way, Boston, MA 02101",
    createdAt: "2026-01-28T12:00:00Z",
  },
  {
    id: "ord-33",
    orderNumber: "ORD-2025-033",
    customer: {
      id: "cust-28",
      name: "Carter Adams",
      email: "carter.adams@example.com",
    },
    items: [
      {
        productId: "prod-18",
        name: "Ray-Ban Wayfarer Classic",
        quantity: 1,
        price: 163,
      },
      {
        productId: "prod-17",
        name: "Adidas Ultraboost Light",
        quantity: 1,
        price: 190,
      },
    ],
    status: "shipped",
    total: 353,
    shippingAddress: "567 Aspen Circle, Las Vegas, NV 89101",
    createdAt: "2026-01-29T10:15:00Z",
  },
  {
    id: "ord-34",
    orderNumber: "ORD-2025-034",
    customer: {
      id: "cust-13",
      name: "Charlotte Lee",
      email: "charlotte.lee@example.com",
    },
    items: [
      {
        productId: "prod-10",
        name: "Bose QuietComfort Ultra",
        quantity: 1,
        price: 299,
      },
    ],
    status: "delivered",
    total: 299,
    shippingAddress: "135 Willow Court, Miami, FL 33101",
    createdAt: "2026-01-30T16:30:00Z",
  },
  {
    id: "ord-35",
    orderNumber: "ORD-2025-035",
    customer: {
      id: "cust-9",
      name: "Isabella Brown",
      email: "isabella.brown@example.com",
    },
    items: [
      { productId: "prod-1", name: "iPhone 15 Pro", quantity: 1, price: 999 },
    ],
    status: "processing",
    total: 999,
    shippingAddress: "456 Rosemary Lane, Orlando, FL 32801",
    createdAt: "2026-02-01T08:00:00Z",
  },
  {
    id: "ord-36",
    orderNumber: "ORD-2025-036",
    customer: {
      id: "cust-14",
      name: "Benjamin White",
      email: "benjamin.white@example.com",
    },
    items: [
      {
        productId: "prod-20",
        name: "Dyson V15 Detect",
        quantity: 1,
        price: 749,
      },
    ],
    status: "cancelled",
    total: 749,
    shippingAddress: "579 Poplar Drive, Atlanta, GA 30301",
    createdAt: "2026-02-02T11:00:00Z",
  },
  {
    id: "ord-37",
    orderNumber: "ORD-2025-037",
    customer: {
      id: "cust-21",
      name: "Lily Walker",
      email: "lily.walker@example.com",
    },
    items: [
      {
        productId: "prod-5",
        name: 'MacBook Pro 16"',
        quantity: 1,
        price: 2499,
      },
      { productId: "prod-8", name: "Sony WH-1000XM5", quantity: 1, price: 349 },
    ],
    status: "shipped",
    total: 2848,
    shippingAddress: "802 Cherry Lane, Phoenix, AZ 85001",
    createdAt: "2026-02-04T14:30:00Z",
  },
  {
    id: "ord-38",
    orderNumber: "ORD-2025-038",
    customer: {
      id: "cust-12",
      name: "Ethan Anderson",
      email: "ethan.anderson@example.com",
    },
    items: [
      {
        productId: "prod-16",
        name: "Nike Air Max 90",
        quantity: 2,
        price: 130,
      },
    ],
    status: "delivered",
    total: 260,
    shippingAddress: "234 Peachtree St, Savannah, GA 31401",
    createdAt: "2026-02-05T09:00:00Z",
  },
  {
    id: "ord-39",
    orderNumber: "ORD-2025-039",
    customer: {
      id: "cust-3",
      name: "Sofia Rodriguez",
      email: "sofia.rodriguez@example.com",
    },
    items: [
      {
        productId: "prod-12",
        name: "Samsung Galaxy Watch 6",
        quantity: 1,
        price: 329,
      },
    ],
    status: "pending",
    total: 329,
    shippingAddress: "789 Elm Drive, Austin, TX 73301",
    createdAt: "2026-02-07T10:30:00Z",
  },
  {
    id: "ord-40",
    orderNumber: "ORD-2025-040",
    customer: {
      id: "cust-26",
      name: "Aiden Wright",
      email: "aiden.wright@example.com",
    },
    items: [
      {
        productId: "prod-3",
        name: "Google Pixel 9 Pro",
        quantity: 1,
        price: 899,
      },
      {
        productId: "prod-19",
        name: "Herschel Retreat Backpack",
        quantity: 1,
        price: 89,
      },
    ],
    status: "delivered",
    total: 988,
    shippingAddress: "345 Redwood Ave, San Diego, CA 92101",
    createdAt: "2026-02-08T15:00:00Z",
  },
  {
    id: "ord-41",
    orderNumber: "ORD-2025-041",
    customer: {
      id: "cust-11",
      name: "Mia Taylor",
      email: "mia.taylor@example.com",
    },
    items: [
      {
        productId: "prod-13",
        name: "Patagonia Better Sweater",
        quantity: 1,
        price: 139,
      },
    ],
    status: "shipped",
    total: 139,
    shippingAddress: "567 Hawthorn Lane, Sacramento, CA 95801",
    createdAt: "2026-02-10T08:45:00Z",
  },
  {
    id: "ord-42",
    orderNumber: "ORD-2025-042",
    customer: {
      id: "cust-18",
      name: "Jack Robinson",
      email: "jack.robinson@example.com",
    },
    items: [
      {
        productId: "prod-2",
        name: "Samsung Galaxy S24 Ultra",
        quantity: 1,
        price: 1199,
      },
    ],
    status: "processing",
    total: 1199,
    shippingAddress: "113 Magnolia Place, Dallas, TX 75201",
    createdAt: "2026-02-11T12:00:00Z",
  },
  {
    id: "ord-43",
    orderNumber: "ORD-2025-043",
    customer: {
      id: "cust-25",
      name: "Chloe King",
      email: "chloe.king@example.com",
    },
    items: [
      {
        productId: "prod-14",
        name: "Levi's 501 Original Jeans",
        quantity: 1,
        price: 89,
      },
      {
        productId: "prod-18",
        name: "Ray-Ban Wayfarer Classic",
        quantity: 1,
        price: 163,
      },
    ],
    status: "delivered",
    total: 252,
    shippingAddress: "890 Primrose Path, Richmond, VA 23219",
    createdAt: "2026-02-13T10:00:00Z",
  },
  {
    id: "ord-44",
    orderNumber: "ORD-2025-044",
    customer: {
      id: "cust-5",
      name: "Olivia Martinez",
      email: "olivia.martinez@example.com",
    },
    items: [
      {
        productId: "prod-6",
        name: "ThinkPad X1 Carbon Gen 12",
        quantity: 1,
        price: 1649,
      },
    ],
    status: "pending",
    total: 1649,
    shippingAddress: "321 Maple Lane, Portland, OR 97201",
    createdAt: "2026-02-15T14:00:00Z",
  },
  {
    id: "ord-45",
    orderNumber: "ORD-2025-045",
    customer: {
      id: "cust-29",
      name: "Penelope Nelson",
      email: "penelope.nelson@example.com",
    },
    items: [
      { productId: "prod-9", name: "AirPods Pro 2", quantity: 2, price: 249 },
    ],
    status: "shipped",
    total: 498,
    shippingAddress: "890 Pinecrest Drive, Charlotte, NC 28201",
    createdAt: "2026-02-16T09:30:00Z",
  },
  {
    id: "ord-46",
    orderNumber: "ORD-2025-046",
    customer: {
      id: "cust-8",
      name: "Daniel Kim",
      email: "daniel.kim@example.com",
    },
    items: [
      {
        productId: "prod-17",
        name: "Adidas Ultraboost Light",
        quantity: 1,
        price: 190,
      },
    ],
    status: "delivered",
    total: 190,
    shippingAddress: "654 Cedar Blvd, Chicago, IL 60601",
    createdAt: "2026-02-18T11:15:00Z",
  },
  {
    id: "ord-47",
    orderNumber: "ORD-2025-047",
    customer: {
      id: "cust-23",
      name: "Grace Allen",
      email: "grace.allen@example.com",
    },
    items: [
      {
        productId: "prod-10",
        name: "Bose QuietComfort Ultra",
        quantity: 1,
        price: 299,
      },
      {
        productId: "prod-13",
        name: "Patagonia Better Sweater",
        quantity: 1,
        price: 139,
      },
    ],
    status: "processing",
    total: 438,
    shippingAddress: "901 Chestnut Ave, Raleigh, NC 27601",
    createdAt: "2026-02-20T13:00:00Z",
  },
  {
    id: "ord-48",
    orderNumber: "ORD-2025-048",
    customer: {
      id: "cust-17",
      name: "Harper Garcia",
      email: "harper.garcia@example.com",
    },
    items: [
      { productId: "prod-8", name: "Sony WH-1000XM5", quantity: 1, price: 349 },
    ],
    status: "delivered",
    total: 349,
    shippingAddress: "345 Juniper Way, Tucson, AZ 85701",
    createdAt: "2026-02-21T08:00:00Z",
  },
  {
    id: "ord-49",
    orderNumber: "ORD-2025-049",
    customer: {
      id: "cust-30",
      name: "Sebastian Hill",
      email: "sebastian.hill@example.com",
    },
    items: [
      { productId: "prod-1", name: "iPhone 15 Pro", quantity: 1, price: 999 },
      {
        productId: "prod-11",
        name: "Apple Watch Ultra 2",
        quantity: 1,
        price: 799,
      },
    ],
    status: "pending",
    total: 1798,
    shippingAddress: "567 Linden Ave, Milwaukee, WI 53201",
    createdAt: "2026-02-23T15:30:00Z",
  },
  {
    id: "ord-50",
    orderNumber: "ORD-2025-050",
    customer: {
      id: "cust-1",
      name: "Emma Thompson",
      email: "emma.thompson@example.com",
    },
    items: [
      {
        productId: "prod-5",
        name: 'MacBook Pro 16"',
        quantity: 1,
        price: 2499,
      },
    ],
    status: "shipped",
    total: 2499,
    shippingAddress: "123 Oak Street, San Francisco, CA 94102",
    createdAt: "2026-02-25T10:00:00Z",
  },
]
```

- [ ] **Step 5: Create `src/demo/data/messages.ts`**

```typescript
import type { Message } from "@/demo/types"

export const messages: Message[] = [
  {
    id: "msg-1",
    from: { name: "Sarah Mitchell", email: "sarah.mitchell@vendor.com" },
    subject: "New bulk pricing proposal",
    body: "Hi there,\n\nI wanted to reach out regarding the bulk pricing we discussed last week. We can offer a 15% discount on orders over 500 units for the Sony WH-1000XM5 headphones.\n\nPlease find the updated pricing sheet attached. Let me know if you have any questions or would like to proceed.\n\nBest regards,\nSarah Mitchell\nSenior Account Manager",
    isRead: false,
    createdAt: "2026-03-28T09:00:00Z",
  },
  {
    id: "msg-2",
    from: { name: "Tom Reynolds", email: "tom.reynolds@logistics.com" },
    subject: "Shipping delay notification - Batch #4521",
    body: "Dear Admin,\n\nWe're writing to inform you that Batch #4521 containing 45 units of assorted electronics has been delayed due to weather conditions at the distribution hub.\n\nNew estimated delivery: April 5, 2026.\n\nWe apologize for the inconvenience and will keep you updated on any further changes.\n\nRegards,\nTom Reynolds\nLogistics Coordinator",
    isRead: false,
    createdAt: "2026-03-27T14:30:00Z",
  },
  {
    id: "msg-3",
    from: { name: "Emily Carter", email: "emily.carter@payments.com" },
    subject: "Monthly payment processing report",
    body: "Hello,\n\nYour payment processing report for March 2026 is now available.\n\nSummary:\n- Total transactions: 847\n- Successful: 831 (98.1%)\n- Failed: 16 (1.9%)\n- Total processed: $142,580.00\n- Processing fees: $4,135.82\n\nThe full detailed report is available in your merchant dashboard.\n\nBest,\nEmily Carter\nMerchant Services",
    isRead: true,
    createdAt: "2026-03-26T10:00:00Z",
  },
  {
    id: "msg-4",
    from: { name: "David Park", email: "david.park@returns.com" },
    subject: "Return request #RET-2891 needs approval",
    body: "Hi,\n\nA return request has been submitted that requires your approval:\n\n- Order: ORD-2025-035\n- Customer: Isabella Brown\n- Item: iPhone 15 Pro\n- Reason: Product not as described\n- Requested: Full refund\n\nPlease review and approve or deny this request within 48 hours.\n\nThanks,\nDavid Park\nReturns Department",
    isRead: false,
    createdAt: "2026-03-25T16:45:00Z",
  },
  {
    id: "msg-5",
    from: { name: "Lisa Wong", email: "lisa.wong@marketing.com" },
    subject: "Q2 marketing campaign proposals ready",
    body: "Hi Team,\n\nThe Q2 marketing campaign proposals are ready for review. We have three campaigns planned:\n\n1. Spring Sale Event (April 15-22)\n2. Mother's Day Collection (May 1-12)\n3. Summer Kickoff (June 1-15)\n\nEach campaign includes email, social media, and on-site banner creatives. Please review the proposals and provide feedback by Friday.\n\nThanks,\nLisa Wong\nMarketing Director",
    isRead: true,
    createdAt: "2026-03-24T11:00:00Z",
  },
  {
    id: "msg-6",
    from: { name: "Robert Kim", email: "robert.kim@warehouse.com" },
    subject: "Low stock alert - 3 products below threshold",
    body: 'Automated Alert:\n\nThe following products have fallen below the minimum stock threshold:\n\n1. Dell XPS 15 (SKU: DEL-XPS15-1TB) - 8 units remaining (threshold: 15)\n2. Dyson V15 Detect (SKU: DYS-V15D-ABS) - 12 units remaining (threshold: 20)\n3. MacBook Pro 16" (SKU: APL-MBP16-512) - 34 units remaining (threshold: 40)\n\nPlease initiate reorder or adjust thresholds accordingly.\n\nWarehouse Management System',
    isRead: false,
    createdAt: "2026-03-23T08:30:00Z",
  },
  {
    id: "msg-7",
    from: { name: "Jennifer Adams", email: "jennifer.adams@legal.com" },
    subject: "Updated terms of service - Review required",
    body: "Dear Store Administrator,\n\nOur legal team has prepared updated Terms of Service and Privacy Policy documents to comply with the new data protection regulations effective May 1, 2026.\n\nKey changes include:\n- Updated data retention periods\n- New consent requirements for marketing communications\n- Enhanced customer data deletion procedures\n\nPlease review the attached documents and confirm by April 15.\n\nBest regards,\nJennifer Adams\nLegal Counsel",
    isRead: true,
    createdAt: "2026-03-22T15:00:00Z",
  },
  {
    id: "msg-8",
    from: { name: "Alex Rivera", email: "alex.rivera@support.com" },
    subject: "Customer satisfaction survey results - March",
    body: "Hi,\n\nThe March customer satisfaction survey results are in:\n\n- Overall satisfaction: 4.3/5.0 (up from 4.1)\n- Shipping speed: 4.5/5.0\n- Product quality: 4.4/5.0\n- Customer service: 4.1/5.0\n- Website usability: 4.2/5.0\n\nNotable improvement in shipping speed ratings after our carrier switch last month. Customer service scores still have room for improvement - scheduling a team review for next week.\n\nRegards,\nAlex Rivera\nCustomer Experience Lead",
    isRead: true,
    createdAt: "2026-03-21T10:30:00Z",
  },
  {
    id: "msg-9",
    from: { name: "Mike Johnson", email: "mike.johnson@tech.com" },
    subject: "Platform maintenance window - April 6",
    body: "Hello,\n\nWe'll be performing scheduled maintenance on the e-commerce platform on April 6, 2026, from 2:00 AM to 6:00 AM EST.\n\nDuring this window:\n- Checkout will be temporarily unavailable\n- Admin dashboard may experience intermittent access issues\n- All data will be preserved\n\nPlease plan accordingly and notify your team.\n\nThanks,\nMike Johnson\nPlatform Engineering",
    isRead: false,
    createdAt: "2026-03-20T09:00:00Z",
  },
  {
    id: "msg-10",
    from: { name: "Rachel Green", email: "rachel.green@finance.com" },
    subject: "Tax filing reminder - Q1 2026",
    body: "Hi,\n\nFriendly reminder that Q1 2026 sales tax filing is due by April 20, 2026.\n\nI've prepared the preliminary report:\n- Total taxable sales: $487,230.00\n- Total tax collected: $38,978.40\n- States with nexus: 12\n\nPlease review the numbers and let me know if any adjustments are needed before filing.\n\nBest,\nRachel Green\nFinance Manager",
    isRead: true,
    createdAt: "2026-03-19T14:00:00Z",
  },
  {
    id: "msg-11",
    from: { name: "Chris Taylor", email: "chris.taylor@partner.com" },
    subject: "Partnership opportunity - Holiday season",
    body: "Dear Team,\n\nI'm reaching out about a co-marketing partnership opportunity for the upcoming holiday season (November-December 2026).\n\nOur proposal includes:\n- Joint promotional bundles\n- Cross-platform advertising\n- Shared influencer campaigns\n\nExpected ROI based on our previous partnerships: 3-4x on marketing spend.\n\nWould love to set up a call to discuss further. Are you available next Tuesday or Wednesday?\n\nBest,\nChris Taylor\nBusiness Development",
    isRead: false,
    createdAt: "2026-03-18T11:30:00Z",
  },
  {
    id: "msg-12",
    from: { name: "Nancy Lee", email: "nancy.lee@inventory.com" },
    subject: "New product catalog from Samsung available",
    body: "Hi,\n\nSamsung has released their Q2 2026 product catalog with several new items that may interest you:\n\n- Galaxy S25 series (available June)\n- Galaxy Tab S10 (available May)\n- Updated Galaxy Buds lineup\n\nEarly order pricing is available until April 30. I've attached the full catalog with wholesale pricing.\n\nLet me know if you'd like to place any pre-orders.\n\nRegards,\nNancy Lee\nProduct Procurement",
    isRead: true,
    createdAt: "2026-03-17T08:00:00Z",
  },
  {
    id: "msg-13",
    from: { name: "Kevin Brown", email: "kevin.brown@analytics.com" },
    subject: "Weekly traffic report - Unusual spike detected",
    body: "Hi,\n\nOur analytics detected an unusual traffic spike last Thursday:\n\n- Page views: 45,000 (normal: ~15,000)\n- Unique visitors: 28,000 (normal: ~8,000)\n- Source: Organic search (78%)\n- Top landing page: /products (Samsung Galaxy S24 Ultra)\n\nThis appears to be driven by a viral social media post. Conversion rate during the spike was 2.1% vs. our usual 3.4%, suggesting many visitors were browsing rather than buying.\n\nRecommendation: Consider a targeted retargeting campaign for these visitors.\n\nBest,\nKevin Brown\nAnalytics Team",
    isRead: false,
    createdAt: "2026-03-16T10:00:00Z",
  },
  {
    id: "msg-14",
    from: { name: "Diana Walsh", email: "diana.walsh@hr.com" },
    subject: "New hire onboarding - Store operations",
    body: "Hi,\n\nWe have two new team members starting next Monday:\n\n1. Marcus Chen - Customer Service Representative\n2. Priya Patel - Inventory Specialist\n\nPlease ensure their admin dashboard accounts are set up with appropriate permissions by Friday.\n\nMarcus will need access to: Orders, Customers, Messages\nPriya will need access to: Products, Categories, Analytics\n\nThanks,\nDiana Walsh\nHR Manager",
    isRead: true,
    createdAt: "2026-03-15T16:00:00Z",
  },
  {
    id: "msg-15",
    from: { name: "Paul Martinez", email: "paul.martinez@security.com" },
    subject: "Security audit completed - Action items",
    body: "Dear Admin,\n\nOur annual security audit has been completed. Overall rating: GOOD.\n\nKey findings:\n- SSL certificates: Valid (expires August 2026)\n- PCI compliance: Passed\n- Two-factor authentication: Enabled for 85% of admin accounts\n- Password policy: Meets requirements\n\nAction items:\n1. Enable 2FA for remaining 15% of admin accounts by April 30\n2. Update API keys that are older than 6 months\n3. Review and remove inactive admin accounts\n\nFull report attached.\n\nRegards,\nPaul Martinez\nSecurity Auditor",
    isRead: false,
    createdAt: "2026-03-14T12:00:00Z",
  },
]
```

- [ ] **Step 6: Create `src/demo/data/analytics.ts`**

```typescript
import type { AnalyticsDataPoint } from "@/demo/types"

function generateAnalyticsData(): AnalyticsDataPoint[] {
  const data: AnalyticsDataPoint[] = []
  const baseDate = new Date("2026-03-04")

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendMultiplier = isWeekend ? 1.3 : 1
    const trendMultiplier = 1 + i * 0.008

    const baseRevenue = 3200 + Math.sin(i * 0.5) * 800
    const revenue = Math.round(
      baseRevenue * weekendMultiplier * trendMultiplier,
    )
    const baseOrders = 18 + Math.sin(i * 0.4) * 6
    const orders = Math.round(baseOrders * weekendMultiplier * trendMultiplier)
    const baseVisitors = 520 + Math.sin(i * 0.3) * 150
    const visitors = Math.round(
      baseVisitors * weekendMultiplier * trendMultiplier,
    )
    const conversion = Number(((orders / visitors) * 100).toFixed(1))

    data.push({
      date: date.toISOString().split("T")[0],
      revenue,
      orders,
      visitors,
      conversion,
    })
  }

  return data
}

export const analytics: AnalyticsDataPoint[] = generateAnalyticsData()
```

- [ ] **Step 7: Commit**

```bash
git add src/demo/data/
git commit -m "feat(demo): add mock data for all entities"
```

---

## Task 3: Store and hooks

**Files:**

- Create: `src/demo/store.ts`, `src/demo/hooks.ts`

- [ ] **Step 1: Create `src/demo/store.ts`**

```typescript
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
let ordersData = [...initialOrders]
let customersData = [...initialCustomers]
let categoriesData = [...initialCategories]
let messagesData = [...initialMessages]
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
  productsData[index] = { ...productsData[index], ...data }
  return productsData[index]
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
  ordersData[index] = { ...ordersData[index], status }
  return ordersData[index]
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
  categoriesData[index] = { ...categoriesData[index], ...data }
  return categoriesData[index]
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
  messagesData[index] = { ...messagesData[index], isRead: true }
  return messagesData[index]
}

export async function getAnalytics(
  days: number = 30,
): Promise<AnalyticsDataPoint[]> {
  await delay()
  return analyticsData.slice(-days)
}
```

- [ ] **Step 2: Create `src/demo/hooks.ts`**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/demo/store.ts src/demo/hooks.ts
git commit -m "feat(demo): add async store and TanStack Query hooks"
```

---

## Task 4: Update navigation

**Files:**

- Modify: `src/routes/_authenticated.tsx`

- [ ] **Step 1: Replace `src/routes/_authenticated.tsx` with updated nav groups**

```typescript
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import {
  Home,
  BarChart3,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Inbox,
  Settings,
} from "lucide-react"
import { SidebarLayout } from "@/core/layout"
import { useAuthStore } from "@/features/auth"
import type { NavGroup } from "@/core/layout/types"

const nav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingCart },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Messaging",
    items: [{ label: "Inbox", href: "/inbox", icon: Inbox }],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
]

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: () => (
    <SidebarLayout nav={nav}>
      <Outlet />
    </SidebarLayout>
  ),
})
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/_authenticated.tsx
git commit -m "feat(demo): update sidebar navigation with all page groups"
```

---

## Task 5: Dashboard page

**Files:**

- Modify: `src/routes/_authenticated/index.tsx`

- [ ] **Step 1: Replace `src/routes/_authenticated/index.tsx` with full dashboard**

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import {
  StatCard,
  KPICard,
  ProgressCard,
  ActivityFeed,
  MetricGrid,
} from "@/features/dashboard"
import { AreaChart, BarChart, ChartCard } from "@/features/charts"
import { useOrders, useCustomers, useAnalytics } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: orders } = useOrders()
  const { data: customers } = useCustomers()
  const { data: analytics } = useAnalytics(30)

  const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) ?? 0
  const totalOrders = orders?.length ?? 0
  const totalCustomers = customers?.length ?? 0
  const conversionRate =
    analytics && analytics.length > 0
      ? (
          analytics.reduce((sum, a) => sum + a.conversion, 0) / analytics.length
        ).toFixed(1)
      : "0"

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const returningCustomers = customers
    ? customers.filter((c) => c.totalOrders > 1).length
    : 0
  const returningPct =
    totalCustomers > 0
      ? ((returningCustomers / totalCustomers) * 100).toFixed(0)
      : "0"

  const revenueSparkline = analytics
    ? analytics.slice(-14).map((a) => a.revenue)
    : []
  const orderSparkline = analytics
    ? analytics.slice(-14).map((a) => a.orders)
    : []

  const revenueChartData = analytics
    ? analytics.map((a) => ({ date: a.date.slice(5), revenue: a.revenue }))
    : []

  const categoryMap = new Map<string, number>()
  if (orders) {
    for (const order of orders) {
      for (const item of order.items) {
        const current = categoryMap.get(item.name) ?? 0
        categoryMap.set(item.name, current + item.quantity)
      }
    }
  }
  const topProducts = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name: name.split(" ").slice(0, 2).join(" "), count }))

  const monthlySalesTarget = 50000
  const currentMonthRevenue = analytics
    ? analytics.slice(-30).reduce((sum, a) => sum + a.revenue, 0)
    : 0

  const recentActivity = orders
    ? orders
        .slice(0, 8)
        .map((o) => ({
          id: o.id,
          user: { name: o.customer.name },
          action: `placed order ${o.orderNumber} for $${o.total.toLocaleString()}`,
          timestamp: new Date(o.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        }))
    : []

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Overview of your store performance"
        actions={
          <Button variant="outline" size="sm">
            Download Report
          </Button>
        }
      />

      <div className="space-y-6">
        <MetricGrid columns={4}>
          <StatCard
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            label="Total Orders"
            value={totalOrders}
            icon={ShoppingCart}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            label="Total Customers"
            value={totalCustomers}
            icon={Users}
            trend={{ value: 4.1, isPositive: true }}
          />
          <StatCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend={{ value: 1.3, isPositive: false }}
          />
        </MetricGrid>

        <div className="grid gap-4 md:grid-cols-2">
          <KPICard
            label="Average Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
            comparison="vs $52.30 last month"
            sparklineData={revenueSparkline}
          />
          <KPICard
            label="Returning Customers"
            value={`${returningPct}%`}
            comparison={`${returningCustomers} of ${totalCustomers} customers`}
            sparklineData={orderSparkline}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Revenue Trend"
            description="Daily revenue over the last 30 days"
          >
            <AreaChart data={revenueChartData} xKey="date" yKeys={["revenue"]} />
          </ChartCard>
          <ChartCard
            title="Top Products by Quantity"
            description="Most ordered products"
          >
            <BarChart data={topProducts} xKey="name" yKeys={["count"]} />
          </ChartCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ProgressCard
            label="Monthly Sales Target"
            value={currentMonthRevenue}
            target={monthlySalesTarget}
            unit="$"
          />
          <div className="md:col-span-2">
            <ActivityFeed items={recentActivity} title="Recent Orders" />
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/_authenticated/index.tsx
git commit -m "feat(demo): build dashboard page with stats, charts, and activity feed"
```

---

## Task 6: Analytics page

**Files:**

- Create: `src/routes/_authenticated/analytics.tsx`

- [ ] **Step 1: Create `src/routes/_authenticated/analytics.tsx`**

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  LineChart,
  PieChart,
  AreaChart,
  BarChart,
  ChartCard,
} from "@/features/charts"
import { useAnalytics, useOrders } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data: analytics } = useAnalytics(30)
  const { data: orders } = useOrders()

  const revenueData = analytics
    ? analytics.map((a) => ({
        date: a.date.slice(5),
        revenue: a.revenue,
      }))
    : []

  const trafficSources = [
    { name: "Organic Search", value: 42 },
    { name: "Direct", value: 28 },
    { name: "Social Media", value: 18 },
    { name: "Email", value: 8 },
    { name: "Referral", value: 4 },
  ]

  const ordersOverTime = analytics
    ? analytics.map((a) => ({
        date: a.date.slice(5),
        orders: a.orders,
        visitors: Math.round(a.visitors / 10),
      }))
    : []

  const productSales = new Map<string, number>()
  if (orders) {
    for (const order of orders) {
      for (const item of order.items) {
        const current = productSales.get(item.name) ?? 0
        productSales.set(item.name, current + item.quantity * item.price)
      }
    }
  }
  const topProductRevenue = Array.from(productSales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, revenue]) => ({
      name: name.split(" ").slice(0, 2).join(" "),
      revenue,
    }))

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Analytics" }]}
        title="Analytics"
        description="Detailed performance metrics and trends"
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Revenue Trend"
            description="Daily revenue over the last 30 days"
          >
            <LineChart data={revenueData} xKey="date" yKeys={["revenue"]} />
          </ChartCard>
          <ChartCard
            title="Traffic Sources"
            description="Visitor acquisition breakdown"
          >
            <PieChart data={trafficSources} innerRadius={50} />
          </ChartCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Orders & Visitors"
            description="Daily orders and scaled visitor count"
          >
            <AreaChart
              data={ordersOverTime}
              xKey="date"
              yKeys={["orders", "visitors"]}
            />
          </ChartCard>
          <ChartCard
            title="Top Products by Revenue"
            description="Highest revenue-generating products"
          >
            <BarChart
              data={topProductRevenue}
              xKey="name"
              yKeys={["revenue"]}
            />
          </ChartCard>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/_authenticated/analytics.tsx
git commit -m "feat(demo): add analytics page with line, pie, area, and bar charts"
```

---

## Task 7: Products pages

**Files:**

- Create: `src/routes/_authenticated/products/index.tsx`, `src/routes/_authenticated/products/new.tsx`, `src/routes/_authenticated/products/$id/edit.tsx`

- [ ] **Step 1: Create `src/routes/_authenticated/products/index.tsx`**

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import { DataTable, ColumnHeader, RowActions } from "@/features/data-table"
import { useProducts, useDeleteProduct } from "@/demo/hooks"
import type { Product } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/products/")({
  component: ProductsPage,
})

function ProductsPage() {
  const navigate = useNavigate()
  const { data: products, isLoading } = useProducts()
  const deleteProduct = useDeleteProduct()

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.name}
          className="h-10 w-10 rounded-md object-cover"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <ColumnHeader column={column} title="Category" />,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => <ColumnHeader column={column} title="Price" />,
      cell: ({ row }) => `$${row.original.price.toLocaleString()}`,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <ColumnHeader column={column} title="Stock" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === "active"
            ? "default"
            : status === "draft"
              ? "secondary"
              : "outline"
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "Edit",
              onClick: () =>
                navigate({ to: "/products/$id/edit", params: { id: row.original.id } }),
            },
            {
              label: "Delete",
              onClick: () => deleteProduct.mutate(row.original.id),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Products" },
        ]}
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button onClick={() => navigate({ to: "/products/new" })}>
            Add Product
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={products ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search products..."
      />
    </>
  )
}
```

- [ ] **Step 2: Create `src/routes/_authenticated/products/new.tsx`**

```typescript
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
  compareAtPrice: z.number().min(0).optional(),
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
              <TextField field={field} label="SKU" placeholder="e.g. APL-IP15-256" />
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
```

- [ ] **Step 3: Create `src/routes/_authenticated/products/$id/edit.tsx`**

```typescript
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
import { useProduct, useUpdateProduct, useCategories } from "@/demo/hooks"
import type { Product } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/products/$id/edit")({
  component: ProductEditPage,
})

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.number().min(0).optional(),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isActive: z.boolean(),
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

  return <ProductEditForm product={product} categoryOptions={categoryOptions} updateProduct={updateProduct} navigate={navigate} />
}

function ProductEditForm({
  product,
  categoryOptions,
  updateProduct,
  navigate,
}: {
  product: Product
  categoryOptions: Array<{ label: string; value: string }>
  updateProduct: ReturnType<typeof useUpdateProduct>
  navigate: ReturnType<typeof useNavigate>
}) {
  const form = useForm({
    defaultValues: {
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? 0,
      sku: product.sku,
      stock: product.stock,
      isActive: product.status === "active",
    },
    validators: {
      onChange: productSchema,
    },
    onSubmit: async ({ value }) => {
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
    },
  })

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
              <TextField field={field} label="SKU" placeholder="e.g. APL-IP15-256" />
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
          submitLabel="Save Changes"
          onCancel={() => navigate({ to: "/products" })}
          isSubmitting={updateProduct.isPending}
          canSubmit={form.state.canSubmit}
        />
      </form>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/_authenticated/products/
git commit -m "feat(demo): add products list, create, and edit pages"
```

---

## Task 8: Categories page

**Files:**

- Create: `src/routes/_authenticated/categories.tsx`

- [ ] **Step 1: Create `src/routes/_authenticated/categories.tsx`**

```typescript
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog"
import { DataTable, ColumnHeader, RowActions } from "@/features/data-table"
import { TextField, NumberField, SelectField, FormActions } from "@/features/forms"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/demo/hooks"
import type { Category } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
})

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  productCount: z.number().int().min(0),
  status: z.enum(["active", "inactive"]),
})

function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const openCreate = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => <ColumnHeader column={column} title="Slug" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.slug}
        </span>
      ),
    },
    {
      accessorKey: "productCount",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Products" />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: "Edit", onClick: () => openEdit(row.original) },
            {
              label: "Delete",
              onClick: () => deleteCategory.mutate(row.original.id),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Categories" },
        ]}
        title="Categories"
        description="Organize your product catalog"
        actions={<Button onClick={openCreate}>Add Category</Button>}
      />
      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search categories..."
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSubmit={async (values) => {
              if (editingCategory) {
                await updateCategory.mutateAsync({
                  id: editingCategory.id,
                  data: values,
                })
              } else {
                await createCategory.mutateAsync(values)
              }
              setDialogOpen(false)
            }}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createCategory.isPending || updateCategory.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  category: Category | null
  onSubmit: (values: Omit<Category, "id">) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}) {
  const form = useForm({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      productCount: category?.productCount ?? 0,
      status: category?.status ?? ("active" as const),
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value as Omit<Category, "id">)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="name"
        children={(field) => (
          <TextField field={field} label="Name" placeholder="e.g. Electronics" />
        )}
      />
      <form.Field
        name="slug"
        children={(field) => (
          <TextField field={field} label="Slug" placeholder="e.g. electronics" />
        )}
      />
      <form.Field
        name="productCount"
        children={(field) => (
          <NumberField field={field} label="Product Count" min={0} step={1} />
        )}
      />
      <form.Field
        name="status"
        children={(field) => (
          <SelectField
            field={field}
            label="Status"
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        )}
      />
      <FormActions
        submitLabel={category ? "Save Changes" : "Create Category"}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/_authenticated/categories.tsx
git commit -m "feat(demo): add categories page with dialog-based create/edit"
```

---

## Task 9: Orders pages

**Files:**

- Create: `src/routes/_authenticated/orders/index.tsx`, `src/routes/_authenticated/orders/$id.tsx`

- [ ] **Step 1: Create `src/routes/_authenticated/orders/index.tsx`**

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import {
  DataTable,
  ColumnHeader,
  RowActions,
  exportToCsv,
} from "@/features/data-table"
import { useOrders } from "@/demo/hooks"
import type { Order } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/orders/")({
  component: OrdersPage,
})

const statusColors: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

function OrdersPage() {
  const navigate = useNavigate()
  const { data: orders, isLoading } = useOrders()

  const handleExportCsv = () => {
    if (!orders) return
    exportToCsv(
      orders as unknown as Record<string, unknown>[],
      "orders",
      [
        { key: "orderNumber" as keyof Record<string, unknown>, header: "Order Number" },
        { key: "total" as keyof Record<string, unknown>, header: "Total" },
        { key: "status" as keyof Record<string, unknown>, header: "Status" },
        { key: "createdAt" as keyof Record<string, unknown>, header: "Date" },
      ],
    )
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => <ColumnHeader column={column} title="Order" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "customer.name",
      header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => row.original.customer.name,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <ColumnHeader column={column} title="Date" />,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
          >
            {status}
          </span>
        )
      },
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.original.status)
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => <ColumnHeader column={column} title="Total" />,
      cell: ({ row }) => `$${row.original.total.toLocaleString()}`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View Details",
              onClick: () =>
                navigate({
                  to: "/orders/$id",
                  params: { id: row.original.id },
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders" }]}
        title="Orders"
        description="Track and manage customer orders"
        actions={
          <Button variant="outline" onClick={handleExportCsv}>
            Export CSV
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={orders ?? []}
        isLoading={isLoading}
        searchKey="orderNumber"
        searchPlaceholder="Search orders..."
      />
    </>
  )
}
```

- [ ] **Step 2: Create `src/routes/_authenticated/orders/$id.tsx`**

```typescript
import { createFileRoute, Link } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import { useOrder, useUpdateOrderStatus } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetailPage,
})

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusSteps = ["pending", "processing", "shipped", "delivered"] as const

function OrderDetailPage() {
  const { id } = Route.useParams()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(
    order.status as (typeof statusSteps)[number],
  )

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Orders", href: "/orders" },
          { label: order.orderNumber },
        ]}
        title={order.orderNumber}
        description={`Placed on ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`}
        actions={
          <div className="flex gap-2">
            {order.status === "processing" && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "shipped" })
                }
              >
                Mark as Shipped
              </Button>
            )}
            {order.status === "pending" && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "processing" })
                }
              >
                Start Processing
              </Button>
            )}
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "cancelled" })
                }
              >
                Cancel Order
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {order.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    i <= currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm capitalize ${
                    i <= currentStepIndex
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
                {i < statusSteps.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${
                      i < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ${(item.quantity * item.price).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipping" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      No notes for this order.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer.email}
                </p>
                <Separator />
                <Link
                  to="/customers/$id"
                  params={{ id: order.customer.id }}
                  className="text-sm text-primary hover:underline"
                >
                  View customer profile
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/_authenticated/orders/
git commit -m "feat(demo): add orders list with CSV export and order detail page"
```

---

## Task 10: Customers pages

**Files:**

- Create: `src/routes/_authenticated/customers/index.tsx`, `src/routes/_authenticated/customers/$id.tsx`

- [ ] **Step 1: Create `src/routes/_authenticated/customers/index.tsx`**

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { DataTable, ColumnHeader, RowActions } from "@/features/data-table"
import { useCustomers } from "@/demo/hooks"
import type { Customer } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
})

function CustomersPage() {
  const navigate = useNavigate()
  const { data: customers, isLoading } = useCustomers()

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {row.original.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: ({ column }) => <ColumnHeader column={column} title="Orders" />,
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Total Spent" />
      ),
      cell: ({ row }) => `$${row.original.totalSpent.toLocaleString()}`,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <ColumnHeader column={column} title="Joined" />,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View Profile",
              onClick: () =>
                navigate({
                  to: "/customers/$id",
                  params: { id: row.original.id },
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customers" },
        ]}
        title="Customers"
        description="View and manage your customer base"
      />
      <DataTable
        columns={columns}
        data={customers ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search customers..."
      />
    </>
  )
}
```

- [ ] **Step 2: Create `src/routes/_authenticated/customers/$id.tsx`**

```typescript
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { KPICard } from "@/features/dashboard"
import { DataTable, ColumnHeader } from "@/features/data-table"
import { useCustomer, useOrders } from "@/demo/hooks"
import type { Order } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { id } = Route.useParams()
  const { data: customer, isLoading: customerLoading } = useCustomer(id)
  const { data: allOrders } = useOrders()

  const customerOrders = allOrders?.filter((o) => o.customer.id === id) ?? []

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading customer...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    )
  }

  const avgOrderValue =
    customer.totalOrders > 0
      ? customer.totalSpent / customer.totalOrders
      : 0

  const orderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => <ColumnHeader column={column} title="Order" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <ColumnHeader column={column} title="Date" />,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <span className="capitalize">{row.original.status}</span>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => <ColumnHeader column={column} title="Total" />,
      cell: ({ row }) => `$${row.original.total.toLocaleString()}`,
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: customer.name },
        ]}
        title={customer.name}
        description={`Customer since ${new Date(customer.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}`}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {customer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-medium">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
              {customer.phone && (
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            label="Lifetime Value"
            value={`$${customer.totalSpent.toLocaleString()}`}
          />
          <KPICard label="Total Orders" value={customer.totalOrders} />
          <KPICard
            label="Average Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
          />
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <DataTable
              columns={orderColumns}
              data={customerOrders}
              searchKey="orderNumber"
              searchPlaceholder="Search orders..."
            />
          </TabsContent>
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.phone ?? "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/_authenticated/customers/
git commit -m "feat(demo): add customers list and customer detail pages"
```

---

## Task 11: Inbox page

**Files:**

- Create: `src/routes/_inbox.tsx`, `src/routes/_inbox/inbox.tsx`

- [ ] **Step 1: Create `src/routes/_inbox.tsx`**

```typescript
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import {
  Home,
  BarChart3,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Inbox,
  Settings,
} from "lucide-react"
import { useAuthStore } from "@/features/auth"
import type { NavGroup } from "@/core/layout/types"

const nav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingCart },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Messaging",
    items: [{ label: "Inbox", href: "/inbox", icon: Inbox }],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
]

export const Route = createFileRoute("/_inbox")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: () => <Outlet />,
})

export { nav as inboxNav }
```

- [ ] **Step 2: Create `src/routes/_inbox/inbox.tsx`**

```typescript
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { SplitPanelLayout } from "@/core/layout"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { cn } from "@/core/lib/utils"
import { useMessages, useMarkMessageAsRead } from "@/demo/hooks"
import { inboxNav } from "@/routes/_inbox"

export const Route = createFileRoute("/_inbox/inbox")({
  component: InboxPage,
})

function InboxPage() {
  const { data: messages } = useMessages()
  const markAsRead = useMarkMessageAsRead()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedMessage = messages?.find((m) => m.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const message = messages?.find((m) => m.id === id)
    if (message && !message.isRead) {
      markAsRead.mutate(id)
    }
  }

  const panel = (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {messages?.map((message) => (
          <button
            key={message.id}
            onClick={() => handleSelect(message.id)}
            className={cn(
              "w-full px-4 py-3 text-left transition-colors hover:bg-accent",
              selectedId === message.id && "bg-accent",
              !message.isRead && "bg-accent/50",
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {message.from.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      !message.isRead && "font-semibold",
                    )}
                  >
                    {message.from.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-sm",
                    !message.isRead
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {message.subject}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {message.body.slice(0, 80)}...
                </p>
              </div>
              {!message.isRead && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <SplitPanelLayout nav={inboxNav} panel={panel}>
      {selectedMessage ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-medium">{selectedMessage.subject}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {selectedMessage.from.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {selectedMessage.from.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMessage.from.email} &middot;{" "}
                  {new Date(selectedMessage.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {selectedMessage.body}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">
            Select a message to read it
          </p>
        </div>
      )}
    </SplitPanelLayout>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/_inbox.tsx src/routes/_inbox/
git commit -m "feat(demo): add inbox page with SplitPanelLayout and message detail"
```

---

## Task 12: Settings page

**Files:**

- Modify: `src/routes/_authenticated/settings.tsx`

- [ ] **Step 1: Replace `src/routes/_authenticated/settings.tsx` with tabbed settings**

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { PageHeader } from "@/core/layout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Button } from "@/core/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import {
  TextField,
  TextareaField,
  SelectField,
  SwitchField,
  CheckboxField,
  RadioGroupField,
  FormSection,
  FormActions,
} from "@/features/forms"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

const generalSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeDescription: z.string(),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
})

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  orderAlerts: z.boolean(),
  marketingEmails: z.boolean(),
  notificationFrequency: z.enum(["instant", "daily", "weekly"]),
})

function SettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
        ]}
        title="Settings"
        description="Manage your store configuration"
      />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </>
  )
}

function GeneralSettings() {
  const form = useForm({
    defaultValues: {
      storeName: "My E-Commerce Store",
      storeDescription: "A modern online store selling electronics, clothing, and accessories.",
      currency: "usd",
      timezone: "america-new_york",
    },
    validators: {
      onChange: generalSchema,
    },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 500))
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
      <FormSection title="Store Information" description="Basic details about your store">
        <form.Field
          name="storeName"
          children={(field) => (
            <TextField field={field} label="Store Name" placeholder="Your store name" />
          )}
        />
        <form.Field
          name="storeDescription"
          children={(field) => (
            <TextareaField
              field={field}
              label="Store Description"
              placeholder="Describe your store"
              rows={3}
            />
          )}
        />
        <form.Field
          name="currency"
          children={(field) => (
            <SelectField
              field={field}
              label="Currency"
              options={[
                { label: "USD ($)", value: "usd" },
                { label: "EUR (\u20ac)", value: "eur" },
                { label: "GBP (\u00a3)", value: "gbp" },
                { label: "CAD (C$)", value: "cad" },
                { label: "AUD (A$)", value: "aud" },
              ]}
            />
          )}
        />
        <form.Field
          name="timezone"
          children={(field) => (
            <SelectField
              field={field}
              label="Timezone"
              options={[
                { label: "Eastern Time (ET)", value: "america-new_york" },
                { label: "Central Time (CT)", value: "america-chicago" },
                { label: "Mountain Time (MT)", value: "america-denver" },
                { label: "Pacific Time (PT)", value: "america-los_angeles" },
                { label: "UTC", value: "utc" },
              ]}
            />
          )}
        />
      </FormSection>
      <FormActions
        submitLabel="Save Changes"
        isSubmitting={form.state.isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}

function NotificationSettings() {
  const form = useForm({
    defaultValues: {
      emailNotifications: true,
      orderAlerts: true,
      marketingEmails: false,
      notificationFrequency: "instant" as const,
    },
    validators: {
      onChange: notificationsSchema,
    },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 500))
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
      <FormSection title="Email Preferences" description="Control what emails you receive">
        <form.Field
          name="emailNotifications"
          children={(field) => (
            <SwitchField
              field={field}
              label="Email Notifications"
              description="Receive email notifications for important events"
            />
          )}
        />
        <form.Field
          name="orderAlerts"
          children={(field) => (
            <SwitchField
              field={field}
              label="Order Alerts"
              description="Get notified when new orders are placed"
            />
          )}
        />
        <form.Field
          name="marketingEmails"
          children={(field) => (
            <CheckboxField
              field={field}
              label="Marketing Emails"
              description="Receive promotional emails and product updates"
            />
          )}
        />
      </FormSection>

      <FormSection title="Frequency" description="How often you want to receive notifications">
        <form.Field
          name="notificationFrequency"
          children={(field) => (
            <RadioGroupField
              field={field}
              label="Notification Frequency"
              options={[
                { label: "Instant", value: "instant" },
                { label: "Daily digest", value: "daily" },
                { label: "Weekly summary", value: "weekly" },
              ]}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Save Preferences"
        isSubmitting={form.state.isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}

function BillingSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <FormSection title="Current Plan" description="Your active subscription">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pro Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly price</span>
              <span className="text-sm font-medium">$49/month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Billing cycle</span>
              <span className="text-sm font-medium">Monthly</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next billing date</span>
              <span className="text-sm font-medium">May 1, 2026</span>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </FormSection>

      <FormSection title="Billing Information" description="Manage your billing details">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div>
              <p className="text-sm font-medium">Billing Email</p>
              <p className="text-sm text-muted-foreground">billing@example.com</p>
            </div>
            <div>
              <p className="text-sm font-medium">Payment Method</p>
              <p className="text-sm text-muted-foreground">Visa ending in 4242</p>
            </div>
            <div>
              <p className="text-sm font-medium">Billing Address</p>
              <p className="text-sm text-muted-foreground">
                123 Business Ave, Suite 100, San Francisco, CA 94102
              </p>
            </div>
          </CardContent>
        </Card>
      </FormSection>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/_authenticated/settings.tsx
git commit -m "feat(demo): add tabbed settings page with all form field types"
```

---

## Task 13: Final verification

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Fix any type errors before proceeding.

- [ ] **Step 2: Run ESLint**

```bash
npx eslint src/demo/ src/routes/ --fix
```

Fix any lint errors.

- [ ] **Step 3: Run tests**

```bash
npm test -- --run
```

Fix any test failures.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Verify the build completes without errors.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(demo): resolve typecheck, lint, and build issues"
```

Only create this commit if there were fixes needed. If steps 1-4 all passed clean, skip this commit.
