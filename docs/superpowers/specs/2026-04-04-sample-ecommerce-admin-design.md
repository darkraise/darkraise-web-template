# Sample E-Commerce Admin — Design Specification

A comprehensive sample project that demonstrates every feature of the web template through a realistic e-commerce admin dashboard. Uses an in-memory data store with async functions to showcase TanStack Query patterns including loading states, cache invalidation, and optimistic updates.

## Goals

- Demonstrate every template feature module (dashboard, charts, data-table, forms, auth) in a realistic context
- Exercise all four layout variants (Sidebar, SplitPanel, Auth, and the remaining two available for manual swap)
- Show the theming system working across all pages (5 themes × light/dark mode)
- Provide a reference implementation that developers can study when building their own features
- Use mock data layer that mirrors real API patterns for easy replacement later

## Pages (13 total)

### Overview Section

**Dashboard** (`/`)

- Layout: SidebarLayout
- Content: 4 StatCards (total revenue, orders, customers, conversion rate) in a MetricGrid, 2 KPICards (average order value, returning customers with sparklines), revenue AreaChart and orders-by-category BarChart side by side in ChartCards, ProgressCard for monthly sales target, ActivityFeed showing recent order events
- Features demonstrated: StatCard, KPICard, ProgressCard, ActivityFeed, MetricGrid, AreaChart, BarChart, ChartCard, PageHeader with actions

**Analytics** (`/analytics`)

- Layout: SidebarLayout
- Content: Full-page charts view. Revenue trend LineChart, traffic sources PieChart, orders-over-time AreaChart, top products BarChart. Each in a ChartCard. Date range selector in PageHeader actions area.
- Features demonstrated: LineChart, PieChart, AreaChart, BarChart, ChartCard, PageHeader tabs (Overview / Revenue / Traffic sub-views via tabs)

### Catalog Section

**Products List** (`/products`)

- Layout: SidebarLayout
- Content: DataTable with columns: image thumbnail, name, category (badge), price, stock, status (badge with color), actions. Toolbar with search by name, filter by status and category. "Add product" button in PageHeader.
- Features demonstrated: DataTable, ColumnHeader (sorting), DataTableToolbar (search + filters), DataTablePagination, ColumnVisibility, RowActions (edit/archive/delete), Badge, PageHeader with actions

**Product Create** (`/products/new`)

- Layout: SidebarLayout
- Content: Product form with FormSections: "Basic Information" (TextField for name, TextareaField for description, SelectField for category), "Pricing" (NumberField for price, NumberField for compare-at price), "Inventory" (TextField for SKU, NumberField for stock), "Status" (SwitchField for active/draft). FormActions at bottom.
- Features demonstrated: TextField, TextareaField, NumberField, SelectField, SwitchField, FormSection, FormActions, TanStack Form + Zod validation, useMutation for create

**Product Edit** (`/products/$id/edit`)

- Layout: SidebarLayout
- Content: Same form as create, pre-populated with existing product data. Uses route params to fetch product.
- Features demonstrated: Route params, data loading into form, useMutation for update

**Categories** (`/categories`)

- Layout: SidebarLayout
- Content: Simpler DataTable with columns: name, slug, product count, status (badge). RowActions with edit (opens dialog) and delete (confirmation dialog). "Add category" button opens a dialog with a short form.
- Features demonstrated: DataTable (simpler usage), Dialog for create/edit, Badge, inline dialog forms

### Sales Section

**Orders List** (`/orders`)

- Layout: SidebarLayout
- Content: DataTable with columns: order number, customer name, date, status (colored badge), total, actions. Toolbar with search, faceted status filter (multi-select chips), date range filter. Bulk select with "Export CSV" action in toolbar. Row click navigates to order detail.
- Features demonstrated: DataTable with faceted filters, bulk row selection, exportToCsv, Badge with status colors, navigation on row click

**Order Detail** (`/orders/$id`)

- Layout: SidebarLayout
- Content: PageHeader with order number, status badge, and action buttons (mark as shipped, cancel). Two-column layout: left column has order items table (simple, no DataTable needed), shipping address card; right column has customer info card, order timeline/status progression. Tabs at bottom: Items / Shipping / Notes.
- Features demonstrated: Route params, Card, Badge, Separator, Tabs, detail view pattern, PageHeader with breadcrumbs

**Customers List** (`/customers`)

- Layout: SidebarLayout
- Content: DataTable with columns: avatar + name, email, total orders, total spent, joined date, actions. Search by name/email. Column visibility toggle.
- Features demonstrated: DataTable, Avatar, ColumnVisibility, search

**Customer Detail** (`/customers/$id`)

- Layout: SidebarLayout
- Content: Profile header card with avatar, name, email, phone. Three KPICards (lifetime value, total orders, average order value). Order history DataTable (filtered to this customer). Tabs: Orders / Profile.
- Features demonstrated: Avatar, KPICard, DataTable (filtered), Tabs, Card, route params

### Messaging Section

**Inbox** (`/inbox`)

- Layout: **SplitPanelLayout** (different layout from the rest of the app)
- Content: Left panel is a scrollable message list with avatar, sender name, subject preview, timestamp, and unread indicator. Right panel shows the selected message's full content. Clicking a message in the list selects it and marks it as read.
- Features demonstrated: SplitPanelLayout, ScrollArea, Avatar, resizable panel divider, active state highlighting, read/unread state management
- Route architecture: Inbox uses a separate pathless layout route (`_inbox.tsx`) at the same level as `_authenticated.tsx`. This layout applies its own auth guard and renders SplitPanelLayout with the same nav config. This avoids nesting SplitPanelLayout inside SidebarLayout.

### System Section

**Settings** (`/settings`)

- Layout: SidebarLayout
- Content: Tabbed settings page with three tab panels:
  - **General**: Store name (TextField), store description (TextareaField), currency (SelectField), timezone (SelectField). FormActions.
  - **Notifications**: Email notifications (SwitchField), order alerts (SwitchField), marketing emails (CheckboxField), notification frequency (RadioGroupField: instant/daily/weekly). FormActions.
  - **Billing**: Current plan display (Card), upgrade button, billing email (TextField). Read-only info section.
- Features demonstrated: Tabs (as page-level navigation), TextField, TextareaField, SelectField, SwitchField, CheckboxField, RadioGroupField, FormSection, FormActions, Card

## Data Model

### Entities

**Product**

```typescript
interface Product {
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
```

**Order**

```typescript
interface Order {
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
```

**Customer**

```typescript
interface Customer {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}
```

**Category**

```typescript
interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  status: "active" | "inactive"
}
```

**Message**

```typescript
interface Message {
  id: string
  from: { name: string; email: string; avatar?: string }
  subject: string
  body: string
  isRead: boolean
  createdAt: string
}
```

**AnalyticsDataPoint**

```typescript
interface AnalyticsDataPoint {
  date: string
  revenue: number
  orders: number
  visitors: number
  conversion: number
}
```

### Mock Data Volumes

| Entity     | Count   | Rationale                                                                   |
| ---------- | ------- | --------------------------------------------------------------------------- |
| Products   | 20      | Enough to paginate (2 pages at 10/page), variety of categories and statuses |
| Orders     | 50      | 5 pages at 10/page, good status distribution for filter demos               |
| Customers  | 30      | 3 pages, enough for meaningful search results                               |
| Categories | 8       | One per product category, some active/inactive                              |
| Messages   | 15      | Enough for a scrollable inbox, mix of read/unread                           |
| Analytics  | 30 days | Daily data points for realistic chart curves                                |

## Data Layer Architecture

All demo data lives in `src/demo/`:

```
src/demo/
├── data/
│   ├── products.ts       — 20 static product records
│   ├── orders.ts         — 50 static order records
│   ├── customers.ts      — 30 static customer records
│   ├── categories.ts     — 8 static category records
│   ├── messages.ts       — 15 static message records
│   └── analytics.ts      — 30-day time series
├── store.ts              — async CRUD functions with simulated delays
├── types.ts              — all entity TypeScript interfaces
└── hooks.ts              — TanStack Query hooks (useProducts, useOrders, etc.)
```

### Store Functions

`store.ts` exports async functions that wrap the static data with simulated network delays (200-500ms random). Functions include:

- `getProducts()`, `getProduct(id)`, `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`
- `getOrders()`, `getOrder(id)`, `updateOrderStatus(id, status)`
- `getCustomers()`, `getCustomer(id)`
- `getCategories()`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)`
- `getMessages()`, `getMessage(id)`, `markMessageAsRead(id)`
- `getAnalytics(days)`

Mutation functions (create/update/delete) modify the in-memory arrays so changes persist within a session.

### TanStack Query Hooks

`hooks.ts` exports one hook per operation, each using `useQuery` or `useMutation` with proper query keys for cache invalidation:

- `useProducts()`, `useProduct(id)`, `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()`
- `useOrders()`, `useOrder(id)`, `useUpdateOrderStatus()`
- `useCustomers()`, `useCustomer(id)`
- `useCategories()`, `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()`
- `useMessages()`, `useMessage(id)`, `useMarkMessageAsRead()`
- `useAnalytics(days)`

Mutation hooks use `onSuccess` to invalidate related query keys (e.g., creating a product invalidates the `["products"]` query).

## Navigation Structure

```
Sidebar Groups:
├── Overview
│   ├── Dashboard        /
│   └── Analytics        /analytics
├── Catalog
│   ├── Products         /products
│   └── Categories       /categories
├── Sales
│   ├── Orders           /orders
│   └── Customers        /customers
├── Messaging
│   └── Inbox            /inbox
└── System
    └── Settings         /settings
```

Sub-pages not in the sidebar (reached via navigation from parent pages):

- `/products/new` — new product form
- `/products/$id/edit` — edit product form
- `/orders/$id` — order detail
- `/customers/$id` — customer detail

## Layout Assignments

| Layout           | Pages                                                                                                                  | Reason                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| SidebarLayout    | Dashboard, Analytics, Products (list/create/edit), Categories, Orders (list/detail), Customers (list/detail), Settings | Primary admin shell, collapsible sidebar with grouped nav |
| SplitPanelLayout | Inbox                                                                                                                  | Master-detail message interface with resizable divider    |
| AuthLayout       | Login, Register, Forgot Password, Reset Password                                                                       | Already built, no changes needed                          |

TopNavLayout and StackedLayout remain available in the template but are not assigned to routes in the sample. Developers can swap `SidebarLayout` for either in `_authenticated.tsx` to try them.

## Route Structure

```
src/routes/
├── __root.tsx                    — AppProviders wrapper
├── _authenticated.tsx            — auth guard + SidebarLayout (updated nav groups)
├── _authenticated/
│   ├── index.tsx                 — Dashboard
│   ├── analytics.tsx             — Analytics
│   ├── products/
│   │   ├── index.tsx             — Products list
│   │   ├── new.tsx               — Product create form
│   │   └── $id/
│   │       └── edit.tsx          — Product edit form
│   ├── categories.tsx            — Categories list
│   ├── orders/
│   │   ├── index.tsx             — Orders list
│   │   └── $id.tsx               — Order detail
│   ├── customers/
│   │   ├── index.tsx             — Customers list
│   │   └── $id.tsx               — Customer detail
│   └── settings.tsx              — Settings with tabs
├── _inbox.tsx                    — auth guard + SplitPanelLayout (separate layout branch)
├── _inbox/
│   └── inbox.tsx                 — Inbox page content
├── _guest.tsx                    — guest guard + AuthLayout
└── _guest/
    ├── login.tsx
    ├── register.tsx
    ├── forgot-password.tsx
    └── reset-password.tsx
```

## What Changes from Existing Code

The sample project modifies only demo/route-level code. No changes to core or feature module source files.

| What                                       | Action                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| `src/demo/`                                | New directory — all mock data, store, types, hooks           |
| `src/routes/_authenticated.tsx`            | Update nav groups to include all sidebar items               |
| `src/routes/_authenticated/index.tsx`      | Replace placeholder with real dashboard                      |
| `src/routes/_authenticated/settings.tsx`   | Replace placeholder with tabbed settings                     |
| `src/routes/_authenticated/analytics.tsx`  | New page                                                     |
| `src/routes/_authenticated/products/`      | New directory with list, create, edit pages                  |
| `src/routes/_authenticated/categories.tsx` | New page                                                     |
| `src/routes/_authenticated/orders/`        | New directory with list and detail pages                     |
| `src/routes/_authenticated/customers/`     | New directory with list and detail pages                     |
| `src/routes/_inbox.tsx`                    | New pathless layout route with auth guard + SplitPanelLayout |
| `src/routes/_inbox/inbox.tsx`              | New inbox page content                                       |
