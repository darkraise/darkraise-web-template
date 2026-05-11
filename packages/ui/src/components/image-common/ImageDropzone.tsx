import * as React from "react"
import { cn } from "@lib/utils"
import { readFileAsDataURL } from "./readFileAsDataURL"
import type { FileAcceptDetails, FileRejectDetails } from "./types"
import "./image-common.css"

export interface ImageDropzoneProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrop"
> {
  /** Comma-separated list of accepted MIME types. Defaults to image/*. */
  accept?: string
  /** Maximum file size in bytes. Files exceeding this are rejected. */
  maxSize?: number
  onFileAccept?: (details: FileAcceptDetails) => void
  onFileReject?: (details: FileRejectDetails) => void
  /** Disable the file input click-to-browse fallback. Drop still works. */
  disableClick?: boolean
  /** Idle ARIA label / fallback child text. */
  label?: string
  /** Active-state ARIA label / fallback child text. */
  activeLabel?: string
  ref?: React.Ref<HTMLDivElement>
}

const DEFAULT_LABEL = "Drop an image here, or click to browse"
const DEFAULT_ACTIVE_LABEL = "Release to load image"

/**
 * Generic file dropzone — drag-and-drop or click-to-browse. Standalone:
 * doesn't read any context from the cropper or editor, so it can be used
 * as a top-level uploader before any compound has mounted.
 */
function ImageDropzone({
  className,
  children,
  accept = "image/*",
  maxSize,
  onFileAccept,
  onFileReject,
  disableClick,
  label,
  activeLabel,
  ref,
  ...rest
}: ImageDropzoneProps) {
  const [active, setActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const dragDepthRef = React.useRef(0)

  const idleLabel = label ?? DEFAULT_LABEL
  const busyLabel = activeLabel ?? DEFAULT_ACTIVE_LABEL

  const acceptList = React.useMemo(
    () =>
      accept
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    [accept],
  )

  const matchesAccept = React.useCallback(
    (file: File) => {
      if (acceptList.length === 0) return true
      return acceptList.some((entry) => {
        if (entry === "*/*") return true
        if (entry.endsWith("/*")) {
          const prefix = entry.slice(0, -1)
          return file.type.startsWith(prefix)
        }
        return file.type === entry
      })
    },
    [acceptList],
  )

  const handleFile = React.useCallback(
    async (file: File) => {
      if (!matchesAccept(file)) {
        onFileReject?.({ file, reason: "type" })
        return
      }
      if (maxSize !== undefined && file.size > maxSize) {
        onFileReject?.({ file, reason: "size" })
        return
      }
      const dataUrl = await readFileAsDataURL(file)
      onFileAccept?.({ file, dataUrl })
    },
    [matchesAccept, maxSize, onFileAccept, onFileReject],
  )

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current += 1
    setActive(true)
  }
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
  }
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setActive(false)
  }
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current = 0
    setActive(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) void handleFile(file)
  }
  const handleClick = () => {
    if (disableClick) return
    inputRef.current?.click()
  }
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleFile(file)
    event.target.value = ""
  }

  return (
    <div
      ref={ref}
      role={disableClick ? undefined : "button"}
      tabIndex={disableClick ? undefined : 0}
      aria-label={active ? busyLabel : idleLabel}
      className={cn("dr-image-dropzone", className)}
      data-state={active ? "active" : "idle"}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (disableClick) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      {...rest}
    >
      {children ?? <span>{active ? busyLabel : idleLabel}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="dr-image-dropzone-input"
        onChange={handleInputChange}
      />
    </div>
  )
}

export { ImageDropzone }
