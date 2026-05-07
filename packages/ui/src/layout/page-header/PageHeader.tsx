import { Fragment } from "react"
import { useRouterAdapter } from "@router"
import type { PageHeaderProps } from "@layout/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@components/breadcrumb"

export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  tabs,
}: PageHeaderProps) {
  const { Link } = useRouterAdapter()
  return (
    <div className="dr-page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={crumb.label}>
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
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="dr-page-header-row">
        <div>
          <h1 className="dr-page-header-title">{title}</h1>
          {description && (
            <p className="dr-page-header-description">{description}</p>
          )}
        </div>
        {actions && <div className="dr-page-header-actions">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <nav className="dr-page-header-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              to={tab.href}
              className="dr-page-header-tab"
              activeClassName="active"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
