import { describe, expect, it } from "vitest"

import {
  containsItem,
  coversPath,
  findActiveItem,
  flattenNavItems,
  isPathMatch,
} from "./navTree"
import type { NavGroup, NavItem } from "./types"

describe("isPathMatch", () => {
  it("matches an exact path", () => {
    expect(isPathMatch("/settings", "/settings")).toBe(true)
  })

  it("matches a path-segment prefix", () => {
    expect(isPathMatch("/settings/profile", "/settings")).toBe(true)
  })

  it("does not match a partial segment", () => {
    expect(isPathMatch("/settings-old", "/settings")).toBe(false)
  })

  it("does not let the root swallow every path", () => {
    expect(isPathMatch("/orders", "/")).toBe(false)
  })

  it("ignores a trailing slash on either side", () => {
    expect(isPathMatch("/orders", "/orders/")).toBe(true)
    expect(isPathMatch("/orders/", "/orders")).toBe(true)
    expect(isPathMatch("/orders/ord-1", "/orders/")).toBe(true)
    expect(isPathMatch("/orders-old", "/orders/")).toBe(false)
  })
})

describe("coversPath", () => {
  const item: NavItem = {
    label: "Reports",
    href: "/reports",
    children: [
      { label: "Daily", href: "/reports/daily" },
      // A child is free to live outside its parent's path.
      { label: "Revenue", href: "/analytics/revenue" },
    ],
  }

  it("covers its own path", () => {
    expect(coversPath(item, "/reports")).toBe(true)
  })

  it("covers a child living outside the parent's prefix", () => {
    expect(coversPath(item, "/analytics/revenue")).toBe(true)
  })

  it("covers a route below such a child", () => {
    expect(coversPath(item, "/analytics/revenue/q3")).toBe(true)
  })

  it("does not cover an unrelated route", () => {
    expect(coversPath(item, "/analytics")).toBe(false)
  })

  it("walks arbitrarily deep", () => {
    const deep: NavItem = {
      label: "Root",
      href: "/root",
      children: [
        {
          label: "Mid",
          href: "/mid",
          children: [{ label: "Leaf", href: "/leaf" }],
        },
      ],
    }
    expect(coversPath(deep, "/leaf")).toBe(true)
  })
})

describe("flattenNavItems", () => {
  const nav: NavGroup[] = [
    { label: "Overview", items: [{ label: "Dashboard", href: "/" }] },
    {
      label: "Catalog",
      items: [
        {
          label: "Products",
          href: "/products",
          children: [
            { label: "Categories", href: "/categories" },
            {
              label: "Tags",
              href: "/tags",
              children: [{ label: "Archived", href: "/tags/archived" }],
            },
          ],
        },
      ],
    },
  ]

  it("includes nested items so search can reach them", () => {
    expect(flattenNavItems(nav).map((i) => i.href)).toEqual([
      "/",
      "/products",
      "/categories",
      "/tags",
      "/tags/archived",
    ])
  })

  it("keeps label and href together", () => {
    expect(flattenNavItems(nav)).toContainEqual({
      label: "Categories",
      href: "/categories",
    })
  })

  it("de-duplicates a section parent that points at its own index child", () => {
    const withIndex: NavGroup[] = [
      {
        items: [
          {
            label: "Catalog",
            href: "/products",
            children: [
              { label: "Products", href: "/products" },
              { label: "Categories", href: "/categories" },
            ],
          },
        ],
      },
    ]
    expect(flattenNavItems(withIndex)).toEqual([
      { label: "Catalog", href: "/products" },
      { label: "Categories", href: "/categories" },
    ])
  })
})

describe("findActiveItem", () => {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/" },
    { label: "Orders", href: "/orders" },
    {
      label: "Products",
      href: "/products",
      children: [
        { label: "All products", href: "/products" },
        { label: "Categories", href: "/products/categories" },
      ],
    },
    { label: "Settings", href: "/settings" },
  ]
  const active = (path: string) => findActiveItem(items, path)?.label

  it("matches the root only on the root", () => {
    expect(active("/")).toBe("Dashboard")
    expect(active("/orders")).toBe("Orders")
  })

  it("keeps a detail route on its list item", () => {
    expect(active("/orders/ord-1")).toBe("Orders")
  })

  it("prefers the longest match", () => {
    expect(active("/products/categories/42")).toBe("Categories")
  })

  it("lets an index child beat its parent on a shared href", () => {
    expect(active("/products")).toBe("All products")
  })

  it("respects segment boundaries", () => {
    expect(active("/settings-old")).toBeUndefined()
  })

  it("selects an item whose href ends in a slash", () => {
    const slashed: NavItem[] = [
      { label: "Dashboard", href: "/" },
      { label: "Orders", href: "/orders/" },
      { label: "Order lines", href: "/orders/lines" },
    ]
    expect(findActiveItem(slashed, "/orders")?.label).toBe("Orders")
    expect(findActiveItem(slashed, "/orders/ord-1")?.label).toBe("Orders")
    expect(findActiveItem(slashed, "/orders/lines")?.label).toBe("Order lines")
    expect(findActiveItem(slashed, "/")?.label).toBe("Dashboard")
  })

  it("returns undefined when nothing matches", () => {
    expect(active("/nowhere")).toBeUndefined()
  })

  it("finds a grandchild", () => {
    const deep: NavItem[] = [
      {
        label: "Settings",
        href: "/settings",
        children: [
          {
            label: "Billing",
            href: "/settings/billing",
            children: [
              { label: "Invoices", href: "/settings/billing/invoices" },
            ],
          },
        ],
      },
    ]
    expect(findActiveItem(deep, "/settings/billing/invoices/7")?.label).toBe(
      "Invoices",
    )
  })
})

describe("containsItem", () => {
  const invoices: NavItem = { label: "Invoices", href: "/billing/invoices" }
  const billing: NavItem = {
    label: "Billing",
    href: "/billing",
    children: [invoices],
  }
  const settings: NavItem = {
    label: "Settings",
    href: "/settings",
    children: [billing],
  }

  it("holds for the item itself and every descendant", () => {
    expect(containsItem(settings, settings)).toBe(true)
    expect(containsItem(settings, billing)).toBe(true)
    expect(containsItem(settings, invoices)).toBe(true)
  })

  it("compares by identity, not by href", () => {
    expect(containsItem(settings, { ...invoices })).toBe(false)
  })

  it("does not hold upwards or for nothing", () => {
    expect(containsItem(invoices, settings)).toBe(false)
    expect(containsItem(settings, undefined)).toBe(false)
  })
})
