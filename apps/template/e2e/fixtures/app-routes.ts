/** Routes a signed-out visitor sees; they redirect a signed-in user. */
export const GUEST_ROUTES: readonly string[] = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]

/** Every signed-in route outside the component showcase pages. */
export const APP_ROUTES: readonly string[] = [
  "/",
  "/analytics",
  "/products",
  "/products/new",
  "/products/prod-1/edit",
  "/categories",
  "/orders",
  "/orders/ord-1",
  "/customers",
  "/customers/cust-1",
  "/settings",
  "/inbox",
  "/components",
]
