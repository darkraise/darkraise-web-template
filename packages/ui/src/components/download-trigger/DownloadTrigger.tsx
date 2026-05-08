import * as React from "react"
import { Button, type ButtonProps } from "@components/button"

export interface DownloadTriggerProps extends Omit<ButtonProps, "asChild"> {
  /** File contents — Blob, string, or BufferSource. */
  data: Blob | string | BufferSource
  /** Suggested filename in the download prompt. */
  fileName: string
  /** Optional MIME override. Inferred from Blob.type when omitted. */
  mimeType?: string
  /** Callback after the download was triggered. */
  onDownload?: () => void
}

function DownloadTrigger({
  data,
  fileName,
  mimeType,
  onDownload,
  onClick,
  ...rest
}: DownloadTriggerProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    const blob =
      data instanceof Blob
        ? data
        : new Blob([data as BlobPart], {
            type: mimeType ?? "application/octet-stream",
          })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.rel = "noopener"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    onDownload?.()
  }
  return <Button onClick={handleClick} {...rest} />
}

export { DownloadTrigger }
