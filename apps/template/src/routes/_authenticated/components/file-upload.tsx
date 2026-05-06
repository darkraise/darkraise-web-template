import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import {
  FileUpload,
  FileUploadClearTrigger,
  FileUploadDropzone,
  FileUploadHiddenInput,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadItemPreview,
  FileUploadItemPreviewImage,
  FileUploadItemSizeText,
  FileUploadLabel,
  FileUploadTrigger,
  type FileRejectReason,
} from "darkraise-ui/components/file-upload"
import { Progress } from "darkraise-ui/components/progress"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/file-upload")({
  component: FileUploadPage,
})

function SingleImagePreview() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <FileUpload
      acceptedFiles={files}
      onFileChange={(d) => setFiles(d.acceptedFiles)}
      accept="image/*"
      multiple={false}
      maxFiles={1}
    >
      <FileUploadLabel>Avatar (single image)</FileUploadLabel>
      <FileUploadDropzone>
        <Upload className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground text-sm">Drop an image here or</p>
        <FileUploadTrigger>Choose image</FileUploadTrigger>
        <FileUploadHiddenInput />
      </FileUploadDropzone>
      <FileUploadItemGroup>
        {files.map((file) => (
          <FileUploadItem key={`${file.name}-${file.size}`} file={file}>
            <FileUploadItemPreview>
              <FileUploadItemPreviewImage />
            </FileUploadItemPreview>
            <FileUploadItemName />
            <FileUploadItemSizeText />
            <FileUploadItemDeleteTrigger>
              <X className="h-4 w-4" />
            </FileUploadItemDeleteTrigger>
          </FileUploadItem>
        ))}
      </FileUploadItemGroup>
    </FileUpload>
  )
}

function MultiFileWithSizeLimit() {
  const [files, setFiles] = useState<File[]>([])
  const [rejectReason, setRejectReason] = useState<FileRejectReason | null>(
    null,
  )
  return (
    <FileUpload
      acceptedFiles={files}
      onFileChange={(d) => setFiles(d.acceptedFiles)}
      onFileReject={(d) => setRejectReason(d.files[0]?.reason ?? null)}
      maxFiles={3}
      maxFileSize={5 * 1024 * 1024}
    >
      <FileUploadLabel>Documents (max 3, 5MB each)</FileUploadLabel>
      <FileUploadDropzone>
        <Upload className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground text-sm">
          Drag and drop or click to upload
        </p>
        <FileUploadTrigger>Add files</FileUploadTrigger>
        <FileUploadHiddenInput />
      </FileUploadDropzone>
      {rejectReason ? (
        <p className="text-destructive text-xs">Rejected: {rejectReason}</p>
      ) : null}
      <FileUploadItemGroup>
        {files.map((file) => (
          <FileUploadItem key={`${file.name}-${file.size}`} file={file}>
            <FileUploadItemName />
            <FileUploadItemSizeText />
            <FileUploadItemDeleteTrigger>
              <X className="h-4 w-4" />
            </FileUploadItemDeleteTrigger>
          </FileUploadItem>
        ))}
      </FileUploadItemGroup>
      <FileUploadClearTrigger>Clear all</FileUploadClearTrigger>
    </FileUpload>
  )
}

function WithProgressIndicator() {
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const timerRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  )

  useEffect(() => {
    const timers = timerRef.current
    return () => {
      for (const id of timers.values()) clearInterval(id)
      timers.clear()
    }
  }, [])

  return (
    <FileUpload
      acceptedFiles={files}
      onFileAccept={(d) => {
        for (const file of d.files) {
          const key = `${file.name}-${file.size}`
          setProgress((p) => ({ ...p, [key]: 0 }))
          const id = setInterval(() => {
            setProgress((p) => {
              const current = p[key] ?? 0
              const next = Math.min(100, current + 10)
              if (next >= 100) {
                clearInterval(id)
                timerRef.current.delete(key)
              }
              return { ...p, [key]: next }
            })
          }, 200)
          timerRef.current.set(key, id)
        }
      }}
      onFileChange={(d) => setFiles(d.acceptedFiles)}
    >
      <FileUploadLabel>Upload with progress</FileUploadLabel>
      <FileUploadDropzone>
        <Upload className="text-muted-foreground h-8 w-8" />
        <FileUploadTrigger>Browse</FileUploadTrigger>
        <FileUploadHiddenInput />
      </FileUploadDropzone>
      <FileUploadItemGroup>
        {files.map((file) => {
          const key = `${file.name}-${file.size}`
          const value = progress[key] ?? 100
          return (
            <FileUploadItem key={key} file={file}>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <FileUploadItemName />
                  <FileUploadItemSizeText />
                </div>
                <Progress value={value} className="h-1" />
              </div>
              <FileUploadItemDeleteTrigger>
                <X className="h-4 w-4" />
              </FileUploadItemDeleteTrigger>
            </FileUploadItem>
          )
        })}
      </FileUploadItemGroup>
    </FileUpload>
  )
}

function FileUploadPage() {
  return (
    <ShowcasePage
      title="FileUpload"
      description="Drag-and-drop file input with previews, validation, and multi-file support."
    >
      <ShowcaseExample
        title="Single image with preview"
        code={`<FileUpload accept="image/*" multiple={false} maxFiles={1} ...>
  <FileUploadDropzone>
    <FileUploadTrigger>Choose image</FileUploadTrigger>
    <FileUploadHiddenInput />
  </FileUploadDropzone>
  <FileUploadItemGroup>
    {files.map((file) => (
      <FileUploadItem key={...} file={file}>
        <FileUploadItemPreview>
          <FileUploadItemPreviewImage />
        </FileUploadItemPreview>
        <FileUploadItemName />
        <FileUploadItemDeleteTrigger><X /></FileUploadItemDeleteTrigger>
      </FileUploadItem>
    ))}
  </FileUploadItemGroup>
</FileUpload>`}
      >
        <SingleImagePreview />
      </ShowcaseExample>

      <ShowcaseExample
        title="Multi-file with size limit"
        code={`<FileUpload maxFiles={3} maxFileSize={5 * 1024 * 1024} ...>
  <FileUploadDropzone>
    <FileUploadTrigger>Add files</FileUploadTrigger>
    <FileUploadHiddenInput />
  </FileUploadDropzone>
  <FileUploadItemGroup>...</FileUploadItemGroup>
  <FileUploadClearTrigger>Clear all</FileUploadClearTrigger>
</FileUpload>`}
      >
        <MultiFileWithSizeLimit />
      </ShowcaseExample>

      <ShowcaseExample
        title="With progress indicator"
        code={`<FileUpload onFileAccept={(d) => uploadAll(d.files)} ...>
  ...
  <FileUploadItemGroup>
    {files.map((file) => (
      <FileUploadItem key={...} file={file}>
        <FileUploadItemName />
        <Progress value={progress[file.name]} />
        <FileUploadItemDeleteTrigger><X /></FileUploadItemDeleteTrigger>
      </FileUploadItem>
    ))}
  </FileUploadItemGroup>
</FileUpload>`}
      >
        <WithProgressIndicator />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
