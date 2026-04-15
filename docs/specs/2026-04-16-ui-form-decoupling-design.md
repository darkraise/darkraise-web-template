# UI package form decoupling design

**Date:** 2026-04-16
**Scope:** `packages/ui/src/forms`
**Status:** Approved design, ready for implementation planning

## Problem

The `darkraise-ui` package hard-codes `@tanstack/react-form` as a runtime dependency. Three source files import `AnyFieldApi` directly and four more inherit the coupling through a shared `BaseFieldProps`. This forces every consumer of the form fields onto tanstack-form. The package is meant to be stack-neutral (the router decoupling landed on 2026-04-15 as a first step); the form fields should work equally well with react-hook-form, formik, or any other form library.

This spec removes `@tanstack/react-form` from `packages/ui` and converts every field component into a controlled-input primitive that takes plain `value` / `onChange` / `onBlur` / `isInvalid` / `errors` props. Decoupling of `@tanstack/react-table` and `@tanstack/react-virtual` is out of scope and will be addressed separately if needed.

## Current coupling

| API used from `AnyFieldApi`                                 | How the fields use it                                |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `field.name`                                                | `id` on the underlying input, `htmlFor` on the label |
| `field.state.value`                                         | controlled input value                               |
| `field.state.meta.isTouched` and `field.state.meta.isValid` | combined into a single `isInvalid` boolean           |
| `field.state.meta.errors`                                   | passed to the `<FieldError>` component               |
| `field.handleChange(value)`                                 | wired to the input's `onChange`                      |
| `field.handleBlur`                                          | wired to the input's `onBlur`                        |

Eight form component files consume this surface: `field-wrapper.tsx`, `text-field.tsx`, `textarea-field.tsx`, `number-field.tsx`, `select-field.tsx`, `radio-group-field.tsx`, `checkbox-field.tsx`, `switch-field.tsx`. `forms/types.ts` imports `AnyFieldApi` to define the shared `BaseFieldProps` contract.

## Chosen approach

**Controlled primitives plus a thin consumer-owned adapter helper.** The fields accept a new `FieldPrimitiveProps<T>` contract — `name`, `value`, `onChange`, `onBlur`, `isInvalid`, `errors` — and never see an `AnyFieldApi`. The template app supplies a tiny helper `fieldProps(field)` that shapes an `AnyFieldApi` into `FieldPrimitiveProps`. Consumers on react-hook-form or formik write their own ~10-line helper instead.

**Why this over alternatives:**

- An adapter context (the pattern used for router decoupling) is the wrong shape for forms. Field state is local to each `<form.Field>` render; there is no cross-component state to thread through a provider.
- Exporting a tanstack-flavored subpath from the ui package (for example `darkraise-ui/forms/tanstack`) would ship a convenience helper but force us to track tanstack-form versions and list it as an optional peer. The helper is ten lines; asking the consumer to own it keeps `packages/ui` dependency-free.
- Building our own field-state hook from scratch duplicates a well-solved problem and forces consumers to use our engine. The whole point of this refactor is the opposite.

## `FieldPrimitiveProps` interface

Add to `packages/ui/src/forms/types.ts`:

```ts
import type { ReactNode } from "react"

export interface FieldPrimitiveProps<T> {
  name: string
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  isInvalid?: boolean
  errors?: Array<{ message?: string } | undefined>
}

export interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export interface FormActionsProps {
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
}
```

`BaseFieldProps` (which used `field: AnyFieldApi`) is removed. The `errors` type matches the existing `FieldError` component's prop signature exactly, so the error rendering path is unchanged.

Per-field value parameterization gives consumers sharper type checking than the previous `AnyFieldApi` opaque blob: `FieldPrimitiveProps<string>` for text/textarea/select/radio, `FieldPrimitiveProps<number>` for number, `FieldPrimitiveProps<boolean>` for checkbox/switch.

**Controlled-only contract.** These fields are controlled React inputs. `onChange` receives the plain value, not a synthetic event. Consumers using libraries whose default mode is uncontrolled (notably react-hook-form's `register()`) must use the library's controlled entry point (`Controller` for RHF). `register()` returns event-based handlers that do not match this contract.

**Error normalization is the adapter's job.** Each adapter helper is responsible for converting its library's native error shape into the `Array<{ message?: string } | undefined>` form. This keeps the ui package's error rendering library-agnostic. Tanstack-form with a zod validator already produces the matching shape; RHF's `FieldError` wraps as `[{ message: error.message }]`; formik's `string | string[]` wraps as `[{ message: str }]`.

**Checkbox and switch indeterminate state.** Radix `Checkbox`'s `onCheckedChange` reports `boolean | "indeterminate"`. `FieldPrimitiveProps<boolean>` narrows this; the field component coerces with `onChange(checked === true)`. This matches the previous behavior (tanstack-form stored whatever it received) and drops the indeterminate tri-state. If a future use case needs tri-state checkboxes, that's a separate feature.

## Per-file migration

Each field component rewrites to the primitive shape. All follow the same pattern: replace `field: AnyFieldApi, label, description` with `FieldPrimitiveProps<T> & { label, description?, ...specificProps }`, destructure the six primitive members, and wire them where `field.*` was used.

- **`types.ts`** — drop `AnyFieldApi` import; replace `BaseFieldProps` with `FieldPrimitiveProps<T>`.
- **`field-wrapper.tsx`** — take `name`, `label`, `description`, `isInvalid`, `errors`, and the existing `children: (isInvalid: boolean) => ReactNode` render-prop. Use `name` for `htmlFor`. Drop the internal `isInvalid` computation — it's now passed in.
- **`text-field.tsx`** — `FieldPrimitiveProps<string> & { label, description?, placeholder?, type? }`. `id={name}`, `value={value}`, `onChange={(e) => onChange(e.target.value)}`, `onBlur={onBlur}`, `aria-invalid={isInvalid}`.
- **`textarea-field.tsx`** — same shape as text-field with `rows?`.
- **`number-field.tsx`** — `FieldPrimitiveProps<number> & { label, description?, placeholder?, min?, max?, step? }`. `onChange={(e) => onChange(Number(e.target.value))}`.
- **`select-field.tsx`** — `FieldPrimitiveProps<string> & { label, description?, placeholder?, options }`. `onValueChange={onChange}`.
- **`radio-group-field.tsx`** — `FieldPrimitiveProps<string> & { label, description?, options }`. `onValueChange={onChange}`.
- **`checkbox-field.tsx`** — `FieldPrimitiveProps<boolean> & { label, description? }`. `checked={value}`, `onCheckedChange={onChange}`.
- **`switch-field.tsx`** — same shape as checkbox.

## Template adapter helper

Create `apps/template/src/lib/field-props.ts`:

```ts
import type { AnyFieldApi } from "@tanstack/react-form"
import type { FieldPrimitiveProps } from "darkraise-ui/forms"

export function fieldProps<T>(field: AnyFieldApi): FieldPrimitiveProps<T> {
  return {
    name: field.name,
    value: field.state.value as T,
    onChange: (value: T) => field.handleChange(value),
    onBlur: field.handleBlur,
    isInvalid: field.state.meta.isTouched && !field.state.meta.isValid,
    errors: field.state.meta.errors as Array<{ message?: string } | undefined>,
  }
}
```

Consumer usage changes from:

```tsx
<form.Field
  name="name"
  children={(field) => (
    <TextField field={field} label="Name" placeholder="..." />
  )}
/>
```

to:

```tsx
<form.Field
  name="name"
  children={(field) => (
    <TextField {...fieldProps<string>(field)} label="Name" placeholder="..." />
  )}
/>
```

## Cross-library support

The primitive contract is designed so a consumer on any controlled form library can write a ~10-line adapter. These examples are not part of this spec's implementation — they exist to verify the `FieldPrimitiveProps` shape is library-agnostic.

**react-hook-form** (use with `Controller`, not `register()`):

```ts
import type {
  ControllerRenderProps,
  ControllerFieldState,
  FieldValues,
  FieldPath,
} from "react-hook-form"
import type { FieldPrimitiveProps } from "darkraise-ui/forms"

export function rhfFieldProps<
  T,
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>(
  field: ControllerRenderProps<TValues, TName>,
  state: ControllerFieldState,
): FieldPrimitiveProps<T> {
  return {
    name: field.name,
    value: field.value as T,
    onChange: field.onChange,
    onBlur: field.onBlur,
    isInvalid: state.invalid,
    errors: state.error ? [{ message: state.error.message }] : undefined,
  }
}

// Usage:
<Controller
  name="email"
  control={control}
  render={({ field, fieldState }) => (
    <TextField {...rhfFieldProps<string>(field, fieldState)} label="Email" />
  )}
/>
```

**formik** (use `useField` helpers so `onChange` receives the plain value):

```ts
import { useField } from "formik"
import type { FieldPrimitiveProps } from "darkraise-ui/forms"

export function useFormikFieldProps<T>(name: string): FieldPrimitiveProps<T> {
  const [field, meta, helpers] = useField<T>(name)
  return {
    name: field.name,
    value: field.value,
    onChange: (value: T) => void helpers.setValue(value),
    onBlur: () => void helpers.setTouched(true),
    isInvalid: meta.touched && Boolean(meta.error),
    errors: meta.error ? [{ message: meta.error as string }] : undefined,
  }
}

// Usage:
function EmailField() {
  return <TextField {...useFormikFieldProps<string>("email")} label="Email" />
}
```

These two adapters share no code with the tanstack adapter and require zero changes to the ui package. That is the property this refactor exists to enable.

## Template call-site migration

Eight files in `apps/template` render the darkraise field components and must switch from `field={field}` to `{...fieldProps(field)}`:

- `apps/template/src/features/auth/components/forgot-password-form.tsx`
- `apps/template/src/features/auth/components/login-form.tsx`
- `apps/template/src/features/auth/components/register-form.tsx`
- `apps/template/src/features/auth/components/reset-password-form.tsx`
- `apps/template/src/features/products/components/product-form.tsx`
- `apps/template/src/routes/_authenticated/categories.tsx`
- `apps/template/src/routes/_authenticated/components/form-fields.tsx`
- `apps/template/src/routes/_authenticated/settings.tsx`

Each call-site also adds `import { fieldProps } from "@/lib/field-props"`.

## Testing

Add one targeted unit test: `packages/ui/src/forms/components/field-wrapper.test.tsx` verifies that `FieldWrapper` renders the label, calls the children render-prop with the correct `isInvalid` flag, and renders `<FieldError>` with the supplied errors when `isInvalid` is true. No tanstack dependency in the test — it renders the component with plain primitive props.

The other field components are thin wrappers over their respective input primitives; their behavior is already exercised by existing component tests for `Input`, `Textarea`, `Select`, etc. No new tests required.

## Migration order

1. Update `packages/ui/src/forms/types.ts` to export `FieldPrimitiveProps` and remove `BaseFieldProps`.
2. Migrate all eight form component files in a single changeset (they share the interface; a partial migration leaves the forms module inconsistent).
3. Add the `field-wrapper.test.tsx` unit test.
4. Add `apps/template/src/lib/field-props.ts`.
5. Update all eight template call-sites to use `fieldProps`.
6. Remove `@tanstack/react-form` from `packages/ui/package.json`. Run `pnpm install` and the full verification sweep: `pnpm --filter darkraise-ui typecheck && build && test`, then `pnpm --filter darkraise-web-template typecheck && build`. Final browser check: log into the template app and submit at least one form (login) to confirm fields validate and submit correctly.

## Non-goals

- Decoupling `@tanstack/react-table` or `@tanstack/react-virtual`.
- Changing the template app's choice of form library. The app continues to use tanstack-form; only the ui package becomes neutral.
- Shipping pre-built adapters for other form libraries. Consumers on react-hook-form or formik write their own ten-line helper.

## Success criteria

- `packages/ui/package.json` lists no `@tanstack/react-form` dependency.
- `grep "@tanstack/react-form" packages/ui/src` returns no matches.
- `pnpm --filter darkraise-ui typecheck`, `build`, and `test` all succeed.
- The template app's login, register, forgot-password, reset-password, product, category, and settings forms render, validate, and submit with the same behavior as before the change.
- `FieldWrapper` unit test passes without importing from `@tanstack/react-form`.
