import * as React from "react"
import { type UseImageEditorReturn } from "./useImageEditor"

export const ImageEditorContext =
  React.createContext<UseImageEditorReturn | null>(null)

export function useImageEditorContext(consumer: string): UseImageEditorReturn {
  const ctx = React.useContext(ImageEditorContext)
  if (!ctx) {
    throw new Error(
      `<${consumer}> must be rendered inside <ImageEditor> or <ImageEditorRootProvider>`,
    )
  }
  return ctx
}
