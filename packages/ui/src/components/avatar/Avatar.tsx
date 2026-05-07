"use client"

import * as React from "react"

import { useEvent } from "@primitives/state"
import { cn } from "@lib/utils"
import "./avatar.css"

import { useImageLoadingStatus, type ImageLoadingStatus } from "./useAvatar"

interface AvatarContextValue {
  imageLoadingStatus: ImageLoadingStatus
  onImageLoadingStatusChange: (status: ImageLoadingStatus) => void
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

function useAvatarContext(consumer: string): AvatarContextValue {
  const ctx = React.useContext(AvatarContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Avatar>`)
  return ctx
}

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>
}

function Avatar({ className, ref, ...props }: AvatarProps) {
  const [status, setStatus] = React.useState<ImageLoadingStatus>("idle")
  const value = React.useMemo<AvatarContextValue>(
    () => ({
      imageLoadingStatus: status,
      onImageLoadingStatusChange: setStatus,
    }),
    [status],
  )
  return (
    <AvatarContext.Provider value={value}>
      <span ref={ref} className={cn("dr-avatar", className)} {...props} />
    </AvatarContext.Provider>
  )
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void
  ref?: React.Ref<HTMLImageElement>
}

function AvatarImage({
  className,
  src,
  onLoadingStatusChange,
  ref,
  ...props
}: AvatarImageProps) {
  const ctx = useAvatarContext("AvatarImage")
  const status = useImageLoadingStatus(src, {
    referrerPolicy: props.referrerPolicy,
    crossOrigin: props.crossOrigin,
  })
  const handleStatusChange = useEvent((next: ImageLoadingStatus) => {
    onLoadingStatusChange?.(next)
    ctx.onImageLoadingStatusChange(next)
  })

  React.useLayoutEffect(() => {
    if (status !== "idle") handleStatusChange(status)
  }, [status, handleStatusChange])

  return status === "loaded" ? (
    <img
      ref={ref}
      src={src}
      className={cn("dr-avatar-image", className)}
      {...props}
    />
  ) : null
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  delayMs?: number
  ref?: React.Ref<HTMLSpanElement>
}

function AvatarFallback({
  className,
  delayMs,
  ref,
  ...props
}: AvatarFallbackProps) {
  const ctx = useAvatarContext("AvatarFallback")
  const [canRender, setCanRender] = React.useState(delayMs === undefined)

  React.useEffect(() => {
    if (delayMs === undefined) return
    const id = window.setTimeout(() => setCanRender(true), delayMs)
    return () => window.clearTimeout(id)
  }, [delayMs])

  if (!canRender || ctx.imageLoadingStatus === "loaded") return null
  return (
    <span
      ref={ref}
      className={cn("dr-avatar-fallback", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
