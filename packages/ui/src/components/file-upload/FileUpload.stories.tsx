import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
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
} from "./FileUpload"

const meta: Meta<typeof FileUpload> = {
  title: "UI/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof FileUpload>

export const Default: Story = {
  render: () => {
    const [files, setFiles] = React.useState<File[]>([])
    return (
      <div className="w-[420px]">
        <FileUpload
          acceptedFiles={files}
          onFileChange={(d) => setFiles(d.acceptedFiles)}
        >
          <FileUploadLabel>Upload files</FileUploadLabel>
          <FileUploadDropzone>
            <Upload className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Drop files here or click to browse
            </p>
            <FileUploadTrigger>Browse files</FileUploadTrigger>
            <FileUploadHiddenInput />
          </FileUploadDropzone>
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
      </div>
    )
  },
}

export const SingleImageWithPreview: Story = {
  render: () => {
    const [files, setFiles] = React.useState<File[]>([])
    return (
      <div className="w-[420px]">
        <FileUpload
          acceptedFiles={files}
          onFileChange={(d) => setFiles(d.acceptedFiles)}
          accept="image/*"
          multiple={false}
          maxFiles={1}
        >
          <FileUploadLabel>Avatar</FileUploadLabel>
          <FileUploadDropzone>
            <Upload className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">Drop an image</p>
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
      </div>
    )
  },
}

export const WithSizeLimit: Story = {
  render: () => {
    const [files, setFiles] = React.useState<File[]>([])
    const [error, setError] = React.useState<string | null>(null)
    return (
      <div className="w-[420px]">
        <FileUpload
          acceptedFiles={files}
          onFileChange={(d) => setFiles(d.acceptedFiles)}
          onFileReject={(d) => {
            const reason = d.files[0]?.reason
            setError(reason ? `Rejected: ${reason}` : null)
          }}
          maxFiles={3}
          maxFileSize={5 * 1024 * 1024}
        >
          <FileUploadLabel>Documents (max 3, 5MB each)</FileUploadLabel>
          <FileUploadDropzone>
            <Upload className="text-muted-foreground h-8 w-8" />
            <FileUploadTrigger>Add files</FileUploadTrigger>
            <FileUploadHiddenInput />
          </FileUploadDropzone>
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
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
      </div>
    )
  },
}
