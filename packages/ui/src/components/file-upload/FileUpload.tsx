"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import {
  type FileRejectReason,
  type FileRejection,
  type FileUploadAccept,
  type FileUploadFileAcceptDetails,
  type FileUploadFileChangeDetails,
  type FileUploadFileRejectDetails,
  type UseFileUploadOptions,
  type UseFileUploadReturn,
  fileKey,
  formatFileSize as defaultFormatFileSize,
  useFileUpload,
} from "./useFileUpload"
import "./file-upload.css"

export type {
  FileRejectReason,
  FileRejection,
  FileUploadAccept,
  FileUploadFileAcceptDetails,
  FileUploadFileChangeDetails,
  FileUploadFileRejectDetails,
  UseFileUploadOptions,
  UseFileUploadReturn,
}

interface FileUploadContextValue extends UseFileUploadReturn {
  hiddenInputRef: React.RefObject<HTMLInputElement | null>
  openPicker: () => void
  dragover: boolean
  formatFileSize: (bytes: number) => string
  baseId: string
}

const FileUploadContext = React.createContext<FileUploadContextValue | null>(
  null,
)

function useFileUploadContext(part: string): FileUploadContextValue {
  const ctx = React.useContext(FileUploadContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <FileUpload> root component`,
    )
  }
  return ctx
}

interface FileUploadItemContextValue {
  file: File
}

const FileUploadItemContext =
  React.createContext<FileUploadItemContextValue | null>(null)

function useFileUploadItemContext(part: string): FileUploadItemContextValue {
  const ctx = React.useContext(FileUploadItemContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <FileUploadItem>`)
  }
  return ctx
}

export interface FileUploadProps
  extends
    Omit<UseFileUploadOptions, never>,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  formatFileSize?: (bytes: number) => string
  children?: React.ReactNode
}

function FileUpload({
  className,
  acceptedFiles,
  defaultAcceptedFiles,
  accept,
  maxFiles,
  maxFileSize,
  minFileSize,
  multiple,
  disabled,
  onFileAccept,
  onFileReject,
  onFileChange,
  formatFileSize: formatFileSizeProp,
  children,
  ...rest
}: FileUploadProps) {
  const baseId = React.useId()
  const hiddenInputRef = React.useRef<HTMLInputElement | null>(null)
  const dragCounterRef = React.useRef(0)
  const [dragover, setDragover] = React.useState(false)

  const state = useFileUpload({
    acceptedFiles,
    defaultAcceptedFiles,
    accept,
    maxFiles,
    maxFileSize,
    minFileSize,
    multiple,
    disabled,
    onFileAccept,
    onFileReject,
    onFileChange,
  })

  const openPicker = React.useCallback(() => {
    if (state.disabled) return
    hiddenInputRef.current?.click()
  }, [state.disabled])

  const ctx = React.useMemo<FileUploadContextValue>(
    () => ({
      ...state,
      hiddenInputRef,
      openPicker,
      dragover,
      formatFileSize: formatFileSizeProp ?? defaultFormatFileSize,
      baseId,
    }),
    [state, openPicker, dragover, formatFileSizeProp, baseId],
  )

  // Internal API for the dropzone to mutate the drag counter.
  const dragApi = React.useMemo(
    () => ({
      onEnter: () => {
        dragCounterRef.current += 1
        setDragover(true)
      },
      onLeave: () => {
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
        if (dragCounterRef.current === 0) setDragover(false)
      },
      onDropFinish: () => {
        dragCounterRef.current = 0
        setDragover(false)
      },
    }),
    [],
  )

  return (
    <FileUploadContext.Provider value={ctx}>
      <DragApiContext.Provider value={dragApi}>
        <div
          className={cn("dr-file-upload", className)}
          data-disabled={state.disabled ? "true" : undefined}
          data-dragover={dragover ? "true" : undefined}
          {...rest}
        >
          {children}
        </div>
      </DragApiContext.Provider>
    </FileUploadContext.Provider>
  )
}

interface DragApi {
  onEnter: () => void
  onLeave: () => void
  onDropFinish: () => void
}

const DragApiContext = React.createContext<DragApi | null>(null)

export type FileUploadLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

function FileUploadLabel({ className, ...props }: FileUploadLabelProps) {
  const { baseId } = useFileUploadContext("FileUploadLabel")
  return (
    <label
      htmlFor={`${baseId}-input`}
      className={cn("dr-file-upload-label", className)}
      {...props}
    />
  )
}

export interface FileUploadDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function FileUploadDropzone({
  className,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ref,
  children,
  ...props
}: FileUploadDropzoneProps) {
  const ctx = useFileUploadContext("FileUploadDropzone")
  const drag = React.useContext(DragApiContext)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (ctx.disabled) return
    const target = event.target as HTMLElement
    if (target.closest("button, input, a")) return
    ctx.openPicker()
  }

  const hasFiles = (event: React.DragEvent<HTMLDivElement>) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files")

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    onDragEnter?.(event)
    if (event.defaultPrevented) return
    if (ctx.disabled) return
    if (!hasFiles(event)) return
    event.preventDefault()
    drag?.onEnter()
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    onDragOver?.(event)
    if (event.defaultPrevented) return
    if (ctx.disabled) return
    if (!hasFiles(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    onDragLeave?.(event)
    if (event.defaultPrevented) return
    if (!hasFiles(event)) return
    drag?.onLeave()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    onDrop?.(event)
    if (event.defaultPrevented) return
    if (ctx.disabled) {
      drag?.onDropFinish()
      return
    }
    event.preventDefault()
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      ctx.addFiles(Array.from(files))
    }
    drag?.onDropFinish()
  }

  return (
    <div
      ref={ref}
      role="presentation"
      className={cn("dr-file-upload-dropzone", className)}
      data-disabled={ctx.disabled ? "true" : undefined}
      data-dragover={ctx.dragover ? "true" : undefined}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...props}
    >
      {children}
    </div>
  )
}

export interface FileUploadTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function FileUploadTrigger({
  className,
  type = "button",
  onClick,
  disabled: disabledProp,
  ref,
  children,
  ...props
}: FileUploadTriggerProps) {
  const ctx = useFileUploadContext("FileUploadTrigger")
  const disabled = !!disabledProp || ctx.disabled
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-file-upload-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        event.stopPropagation()
        ctx.openPicker()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface FileUploadHiddenInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "multiple" | "accept"
> {
  ref?: React.Ref<HTMLInputElement>
}

function FileUploadHiddenInput({
  className,
  ref,
  onChange,
  ...props
}: FileUploadHiddenInputProps) {
  const ctx = useFileUploadContext("FileUploadHiddenInput")
  const { hiddenInputRef } = ctx

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      hiddenInputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    },
    [hiddenInputRef, ref],
  )

  const acceptAttr = Array.isArray(ctx.accept)
    ? ctx.accept.join(",")
    : ctx.accept

  return (
    <input
      ref={setRef}
      id={`${ctx.baseId}-input`}
      type="file"
      multiple={ctx.multiple}
      accept={acceptAttr}
      disabled={ctx.disabled}
      tabIndex={-1}
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
      className={className}
      onChange={(event) => {
        onChange?.(event)
        if (event.defaultPrevented) return
        const files = event.target.files
        if (files && files.length > 0) {
          ctx.addFiles(Array.from(files))
        }
        // Reset so selecting the same file again still fires change.
        event.target.value = ""
      }}
      {...props}
    />
  )
}

export interface FileUploadItemGroupProps extends React.HTMLAttributes<HTMLUListElement> {
  ref?: React.Ref<HTMLUListElement>
}

function FileUploadItemGroup({
  className,
  ref,
  ...props
}: FileUploadItemGroupProps) {
  return (
    <ul
      ref={ref}
      className={cn("dr-file-upload-item-group", className)}
      {...props}
    />
  )
}

export interface FileUploadItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  file: File
  ref?: React.Ref<HTMLLIElement>
}

function FileUploadItem({
  className,
  file,
  ref,
  children,
  ...props
}: FileUploadItemProps) {
  const itemCtx = React.useMemo<FileUploadItemContextValue>(
    () => ({ file }),
    [file],
  )
  return (
    <FileUploadItemContext.Provider value={itemCtx}>
      <li
        ref={ref}
        className={cn("dr-file-upload-item", className)}
        data-file-key={fileKey(file)}
        {...props}
      >
        {children}
      </li>
    </FileUploadItemContext.Provider>
  )
}

export interface FileUploadItemPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: string
  ref?: React.Ref<HTMLDivElement>
}

function FileUploadItemPreview({
  className,
  type,
  ref,
  children,
  ...props
}: FileUploadItemPreviewProps) {
  const { file } = useFileUploadItemContext("FileUploadItemPreview")
  if (
    type &&
    !(file.type || "").startsWith(type === "image/*" ? "image/" : type)
  ) {
    return null
  }
  return (
    <div
      ref={ref}
      className={cn("dr-file-upload-item-preview", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface FileUploadItemPreviewImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  ref?: React.Ref<HTMLImageElement>
}

function FileUploadItemPreviewImage({
  className,
  alt,
  ref,
  ...props
}: FileUploadItemPreviewImageProps) {
  const { file } = useFileUploadItemContext("FileUploadItemPreviewImage")
  const urlRef = React.useRef<string | null>(null)
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!(file.type || "").startsWith("image/")) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    urlRef.current = objectUrl
    setUrl(objectUrl)
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [file])

  if (!url) return null

  return (
    <img
      ref={ref}
      src={url}
      alt={alt ?? file.name}
      className={cn("dr-file-upload-item-preview-image", className)}
      {...props}
    />
  )
}

export interface FileUploadItemNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>
}

function FileUploadItemName({
  className,
  ref,
  children,
  ...props
}: FileUploadItemNameProps) {
  const { file } = useFileUploadItemContext("FileUploadItemName")
  return (
    <span
      ref={ref}
      className={cn("dr-file-upload-item-name", className)}
      {...props}
    >
      {children ?? file.name}
    </span>
  )
}

export interface FileUploadItemSizeTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>
}

function FileUploadItemSizeText({
  className,
  ref,
  children,
  ...props
}: FileUploadItemSizeTextProps) {
  const { file } = useFileUploadItemContext("FileUploadItemSizeText")
  const ctx = useFileUploadContext("FileUploadItemSizeText")
  return (
    <span
      ref={ref}
      className={cn("dr-file-upload-item-size-text", className)}
      {...props}
    >
      {children ?? ctx.formatFileSize(file.size)}
    </span>
  )
}

export interface FileUploadItemDeleteTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function FileUploadItemDeleteTrigger({
  className,
  type = "button",
  onClick,
  disabled: disabledProp,
  ref,
  children,
  ...props
}: FileUploadItemDeleteTriggerProps) {
  const ctx = useFileUploadContext("FileUploadItemDeleteTrigger")
  const { file } = useFileUploadItemContext("FileUploadItemDeleteTrigger")
  const disabled = !!disabledProp || ctx.disabled
  return (
    <button
      ref={ref}
      type={type}
      aria-label={`Remove ${file.name}`}
      disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-file-upload-item-delete-trigger", className)}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        ctx.removeFile(file)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface FileUploadClearTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function FileUploadClearTrigger({
  className,
  type = "button",
  onClick,
  disabled: disabledProp,
  ref,
  children,
  ...props
}: FileUploadClearTriggerProps) {
  const ctx = useFileUploadContext("FileUploadClearTrigger")
  const disabled = !!disabledProp || ctx.disabled
  if (ctx.acceptedFiles.length === 0) return null
  return (
    <button
      ref={ref}
      type={type}
      aria-label="Clear all files"
      disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-file-upload-clear-trigger", className)}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        ctx.clearAll()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  FileUpload,
  FileUploadLabel,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadHiddenInput,
  FileUploadItemGroup,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemPreviewImage,
  FileUploadItemName,
  FileUploadItemSizeText,
  FileUploadItemDeleteTrigger,
  FileUploadClearTrigger,
}
