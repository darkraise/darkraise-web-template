## Migrating to 2.0.0

Component DOM now carries `dr-*` classes plus `data-variant` /
`data-size` / state `data-*` attributes. Consumers using
`cn(buttonVariants({ variant, size }), extra)` rewrite as either:

- `<Button variant={...} size={...} className={extra} />`, or
- on a non-button element: `className={cn("dr-btn", extra)}` plus
  `data-variant={...}` and `data-size={...}` attributes directly.

`class-variance-authority` is no longer a dependency of this package.
Consumers that imported it transitively must depend on it directly.
