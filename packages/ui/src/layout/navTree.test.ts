import { describe, expect, it } from "vitest"

import { coversPath, flattenNavItems, isPathMatch } from "./navTree"
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
