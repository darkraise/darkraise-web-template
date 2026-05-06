"use client"

import * as React from "react"

export type FileRejectReason =
  | "TOO_LARGE"
  | "TOO_SMALL"
  | "FILE_INVALID_TYPE"
  | "TOO_MANY_FILES"

export interface FileRejection {
  file: File
  reason: FileRejectReason
}

export interface FileUploadFileAcceptDetails {
  files: File[]
}

export interface FileUploadFileRejectDetails {
  files: FileRejection[]
}

export interface FileUploadFileChangeDetails {
  acceptedFiles: File[]
  rejectedFiles: FileRejection[]
}

export type FileUploadAccept = string | string[]

export interface UseFileUploadOptions {
  acceptedFiles?: File[]
  defaultAcceptedFiles?: File[]
  accept?: FileUploadAccept
  maxFiles?: number
  maxFileSize?: number
  minFileSize?: number
  multiple?: boolean
  disabled?: boolean
  onFileAccept?: (details: FileUploadFileAcceptDetails) => void
  onFileReject?: (details: FileUploadFileRejectDetails) => void
  onFileChange?: (details: FileUploadFileChangeDetails) => void
}

export interface UseFileUploadReturn {
  acceptedFiles: File[]
  rejectedFiles: FileRejection[]
  addFiles: (files: File[]) => void
  removeFile: (file: File) => void
  clearAll: () => void
  accept: FileUploadAccept | undefined
  multiple: boolean
  maxFiles: number | undefined
  maxFileSize: number | undefined
  minFileSize: number
  disabled: boolean
}

const ALL_FILES_ACCEPT_REGEX = /\*\/\*$|^\*$/

function normalizeAccept(
  accept: FileUploadAccept | undefined,
): string[] | null {
  if (!accept) return null
  if (Array.isArray(accept)) return accept.map((s) => s.trim()).filter(Boolean)
  return accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function matchesAccept(
  file: File,
  accept: FileUploadAccept | undefined,
): boolean {
  const list = normalizeAccept(accept)
  if (!list || list.length === 0) return true
  const fileType = (file.type || "").toLowerCase()
  const fileName = (file.name || "").toLowerCase()
  return list.some((entry) => {
    const e = entry.toLowerCase()
    if (ALL_FILES_ACCEPT_REGEX.test(e)) return true
    if (e.startsWith(".")) {
      return fileName.endsWith(e)
    }
    if (e.endsWith("/*")) {
      const prefix = e.slice(0, -1) // keeps trailing "/"
      return fileType.startsWith(prefix)
    }
    return fileType === e
  })
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let size = bytes / 1024
  let unitIdx = 0
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024
    unitIdx++
  }
  const rounded = size >= 100 ? Math.round(size) : Math.round(size * 10) / 10
  return `${rounded} ${units[unitIdx]}`
}

export function fileKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`
}

export function useFileUpload(
  options: UseFileUploadOptions,
): UseFileUploadReturn {
  const {
    acceptedFiles: acceptedProp,
    defaultAcceptedFiles,
    accept,
    maxFiles,
    maxFileSize,
    minFileSize = 0,
    multiple = true,
    disabled = false,
    onFileAccept,
    onFileReject,
    onFileChange,
  } = options

  const controlled = acceptedProp !== undefined

  const [internalAccepted, setInternalAccepted] = React.useState<File[]>(
    () => defaultAcceptedFiles ?? [],
  )
  const [rejectedFiles, setRejectedFiles] = React.useState<FileRejection[]>([])

  const acceptedFiles = controlled ? acceptedProp : internalAccepted

  const onFileAcceptRef = React.useRef(onFileAccept)
  const onFileRejectRef = React.useRef(onFileReject)
  const onFileChangeRef = React.useRef(onFileChange)
  React.useEffect(() => {
    onFileAcceptRef.current = onFileAccept
    onFileRejectRef.current = onFileReject
    onFileChangeRef.current = onFileChange
  })

  const validate = React.useCallback(
    (file: File, runningCount: number): FileRejectReason | null => {
      if (!matchesAccept(file, accept)) return "FILE_INVALID_TYPE"
      if (maxFileSize !== undefined && file.size > maxFileSize)
        return "TOO_LARGE"
      if (minFileSize > 0 && file.size < minFileSize) return "TOO_SMALL"
      if (maxFiles !== undefined && runningCount >= maxFiles)
        return "TOO_MANY_FILES"
      return null
    },
    [accept, maxFileSize, minFileSize, maxFiles],
  )

  const addFiles = React.useCallback(
    (files: File[]) => {
      if (disabled) return
      const incoming = !multiple && files.length > 0 ? files.slice(0, 1) : files
      const baseAccepted = !multiple ? [] : acceptedFiles.slice()
      const nextAccepted: File[] = baseAccepted.slice()
      const nextRejected: FileRejection[] = []
      for (const file of incoming) {
        const reason = validate(file, nextAccepted.length)
        if (reason) {
          nextRejected.push({ file, reason })
        } else {
          nextAccepted.push(file)
        }
      }
      const finalAccepted = nextAccepted
      const finalRejected = nextRejected
      if (!controlled) setInternalAccepted(finalAccepted)
      setRejectedFiles(finalRejected)
      if (
        finalAccepted.length !== baseAccepted.length ||
        (multiple === false && finalAccepted.length > 0)
      ) {
        onFileAcceptRef.current?.({
          files: finalAccepted.slice(baseAccepted.length),
        })
      }
      if (finalRejected.length > 0) {
        onFileRejectRef.current?.({ files: finalRejected })
      }
      onFileChangeRef.current?.({
        acceptedFiles: finalAccepted,
        rejectedFiles: finalRejected,
      })
    },
    [disabled, multiple, acceptedFiles, controlled, validate],
  )

  const removeFile = React.useCallback(
    (file: File) => {
      if (disabled) return
      const targetKey = fileKey(file)
      const next = acceptedFiles.filter((f) => fileKey(f) !== targetKey)
      if (next.length === acceptedFiles.length) return
      if (!controlled) setInternalAccepted(next)
      onFileChangeRef.current?.({
        acceptedFiles: next,
        rejectedFiles,
      })
    },
    [disabled, controlled, acceptedFiles, rejectedFiles],
  )

  const clearAll = React.useCallback(() => {
    if (disabled) return
    if (acceptedFiles.length === 0 && rejectedFiles.length === 0) return
    if (!controlled) setInternalAccepted([])
    setRejectedFiles([])
    onFileChangeRef.current?.({ acceptedFiles: [], rejectedFiles: [] })
  }, [disabled, controlled, acceptedFiles.length, rejectedFiles.length])

  return {
    acceptedFiles,
    rejectedFiles,
    addFiles,
    removeFile,
    clearAll,
    accept,
    multiple,
    maxFiles,
    maxFileSize,
    minFileSize,
    disabled,
  }
}
