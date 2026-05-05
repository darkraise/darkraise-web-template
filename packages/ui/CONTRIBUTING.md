# Contributing to `darkraise-ui`

## Component styling convention

Every component's visual rules live in a co-located CSS file. Tailwind
utilities sit inside `@apply` declarations under `@layer components`.
Variants and sizes ride on `data-` attributes.

### File layout

```
src/components/<kebab-name>/
  <PascalName>.tsx          // component
  <PascalName>.stories.tsx  // Storybook stories
  <PascalName>.test.tsx     // unit tests
  <kebab-name>.css          // styling
  index.ts
```

### CSS file template

```css
@layer components {
  .dr-<kebab-name > {
    @apply <base utilities>;
  }

  .dr-<kebab-name > [data-variant="<value>"] {
    @apply <variant utilities>;
  }
  .dr-<kebab-name > [data-size="<value>"] {
    @apply <size utilities>;
  }
  .dr-<kebab-name > [data-<state>] {
    @apply <state utilities>;
  }
}
```

Class names are kebab-case with a `dr-` prefix. Subcomponents get their
own class: `dr-<kebab-name>-<subpart>`.

### TSX template

```tsx
import * as React from "react"

import { cn } from "../../lib/utils"
import "./<kebab-name>.css"

export type <Name>Variant = "default" | ...
export type <Name>Size    = "default" | ...

export interface <Name>Props extends React.<HTMLProps> {
  variant?: <Name>Variant
  size?: <Name>Size
}

function <Name>({ className, variant = "default", size = "default", ...props }: <Name>Props) {
  return (
    <element
      className={cn("dr-<kebab-name>", className)}
      data-variant={variant}
      data-size={size}
      {...props}
    />
  )
}
```

### The override contract

Component CSS lives in `@layer components`. Tailwind utilities in the
consumer's `className` land in `@layer utilities`. The layer order in
`theme.css` (`theme, base, components, utilities, overrides`) means
consumer utilities always win over component-class declarations.

State variants are independent: passing `bg-red-500` overrides only the
resting state, not the hover state. Pass `hover:bg-red-600` separately
to override the hover.

Never use `!important` or Tailwind's `!` modifier in this package. Never
emit component CSS into `@layer overrides`.

### Worked examples

See `Button.tsx` + `button.css` (primitive with variants/sizes), `Card.tsx` + `card.css` (compound with subcomponents), and `Tabs.tsx` + `tabs.css` (stateful component using Radix data attributes).
