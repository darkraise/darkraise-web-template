import * as React from "react"

export type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error"

interface UseImageLoadingStatusOptions {
  referrerPolicy?: React.HTMLAttributeReferrerPolicy
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>["crossOrigin"]
}

function resolveStatus(
  image: HTMLImageElement | null,
  src: string | undefined,
): ImageLoadingStatus {
  if (!image) return "idle"
  if (!src) return "error"
  if (image.src !== src) image.src = src
  return image.complete && image.naturalWidth > 0 ? "loaded" : "loading"
}

export function useImageLoadingStatus(
  src: string | undefined,
  options: UseImageLoadingStatusOptions = {},
): ImageLoadingStatus {
  const { referrerPolicy, crossOrigin } = options
  const imageRef = React.useRef<HTMLImageElement | null>(null)
  const [status, setStatus] = React.useState<ImageLoadingStatus>("idle")

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return
    if (imageRef.current === null) {
      imageRef.current = new window.Image()
    }
    const image = imageRef.current
    const handleLoad = () => setStatus("loaded")
    const handleError = () => setStatus("error")
    image.addEventListener("load", handleLoad)
    image.addEventListener("error", handleError)
    setStatus(resolveStatus(image, src))
    return () => {
      image.removeEventListener("load", handleLoad)
      image.removeEventListener("error", handleError)
    }
  }, [src])

  React.useLayoutEffect(() => {
    const image = imageRef.current
    if (!image) return
    if (referrerPolicy) image.referrerPolicy = referrerPolicy
  }, [referrerPolicy])

  React.useLayoutEffect(() => {
    const image = imageRef.current
    if (!image) return
    if (typeof crossOrigin === "string") image.crossOrigin = crossOrigin
  }, [crossOrigin])

  return status
}
