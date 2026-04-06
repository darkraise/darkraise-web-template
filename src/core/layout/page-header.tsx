import React from "react"
import { Link } from "@tanstack/react-router"
import type { PageHeaderProps } from "./types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/core/components/ui/breadcrumb"

export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  tabs,
}: PageHeaderProps) {
  return (
    <div className="space-y-4 pb-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <nav className="border-border flex gap-4 border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              to={tab.href}
              className="text-muted-foreground hover:text-foreground [&.active]:border-primary [&.active]:text-foreground border-b-2 border-transparent px-1 pb-2 text-sm transition-colors duration-150"
              activeProps={{ className: "active" }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
