import * as React from "react"
import type { UseImageCropperReturn } from "./useImageCropper"

const ImageCropperContext = React.createContext<UseImageCropperReturn | null>(
  null,
)

function useImageCropperContext(consumer: string): UseImageCropperReturn {
  const ctx = React.useContext(ImageCropperContext)
  if (!ctx) {
    throw new Error(
      `<${consumer}> must be rendered inside <ImageCropper> or <ImageCropperRootProvider>`,
    )
  }
  return ctx
}

export { ImageCropperContext, useImageCropperContext }
