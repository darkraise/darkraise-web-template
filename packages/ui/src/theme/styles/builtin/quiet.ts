import type { StyleDefinition } from "../../config/schema"

/** The base look: every control and chrome token keeps its `@layer base` value. */
export const quiet: StyleDefinition = {
  label: "Quiet",
  signatures: { navSelection: "chip" },
}
