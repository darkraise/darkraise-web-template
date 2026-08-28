interface SkipLinkProps {
  targetId?: string
  children?: React.ReactNode
}

// Above the toast tier (100). Sharing it meant a toast in the top-left corner
// could cover the first control a keyboard user reaches on the page.
export function SkipLink({
  targetId = "main-content",
  children = "Skip to content",
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="bg-primary-fill text-primary-foreground focus-visible:ring-ring fixed top-4 left-4 z-[110] -translate-y-20 rounded-md px-4 py-2 text-sm font-medium shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2"
    >
      {children}
    </a>
  )
}
