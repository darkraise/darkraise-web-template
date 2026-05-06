import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  FileUpload,
  FileUploadClearTrigger,
  FileUploadDropzone,
  FileUploadHiddenInput,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadItemPreviewImage,
  FileUploadItemSizeText,
  FileUploadLabel,
  FileUploadTrigger,
  type FileUploadFileChangeDetails,
  type FileUploadFileRejectDetails,
} from "./FileUpload"

beforeEach(() => {
  // jsdom does not implement createObjectURL.
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn(() => "blob:mock-url"),
  })
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  })
})

interface BasicProps {
  accept?: string | string[]
  maxFiles?: number
  maxFileSize?: number
  minFileSize?: number
  multiple?: boolean
  disabled?: boolean
  onFileChange?: (d: FileUploadFileChangeDetails) => void
  onFileReject?: (d: FileUploadFileRejectDetails) => void
}

function Basic({
  accept,
  maxFiles,
  maxFileSize,
  minFileSize,
  multiple = true,
  disabled,
  onFileChange,
  onFileReject,
}: BasicProps) {
  const [files, setFiles] = React.useState<File[]>([])
  return (
    <FileUpload
      acceptedFiles={files}
      accept={accept}
      maxFiles={maxFiles}
      maxFileSize={maxFileSize}
      minFileSize={minFileSize}
      multiple={multiple}
      disabled={disabled}
      onFileChange={(d) => {
        setFiles(d.acceptedFiles)
        onFileChange?.(d)
      }}
      onFileReject={onFileReject}
    >
      <FileUploadLabel>Upload</FileUploadLabel>
      <FileUploadDropzone data-testid="dropzone">
        <FileUploadTrigger data-testid="trigger">Browse</FileUploadTrigger>
        <FileUploadHiddenInput data-testid="hidden-input" />
      </FileUploadDropzone>
      <FileUploadItemGroup data-testid="item-group">
        {files.map((file) => (
          <FileUploadItem key={`${file.name}-${file.size}`} file={file}>
            <FileUploadItemName />
            <FileUploadItemSizeText />
            <FileUploadItemDeleteTrigger>x</FileUploadItemDeleteTrigger>
          </FileUploadItem>
        ))}
      </FileUploadItemGroup>
      <FileUploadClearTrigger data-testid="clear">
        Clear all
      </FileUploadClearTrigger>
    </FileUpload>
  )
}

function makeFile(name: string, size: number, type = "text/plain"): File {
  const file = new File(["x".repeat(size)], name, { type })
  // jsdom can mis-report size; force the desired byte count.
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("FileUpload", () => {
  it("trigger click opens the hidden input", async () => {
    render(<Basic />)
    const hidden = screen.getByTestId("hidden-input") as HTMLInputElement
    const clickSpy = vi.spyOn(hidden, "click")
    await userEvent.click(screen.getByTestId("trigger"))
    expect(clickSpy).toHaveBeenCalled()
  })

  it("drop event with valid file adds to acceptedFiles", () => {
    const onFileChange = vi.fn()
    render(<Basic onFileChange={onFileChange} />)
    const dropzone = screen.getByTestId("dropzone")
    const file = makeFile("hello.txt", 10)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    })
    expect(onFileChange).toHaveBeenCalled()
    const calls = onFileChange.mock.calls
    const last = calls[calls.length - 1]?.[0] as FileUploadFileChangeDetails
    expect(last.acceptedFiles).toHaveLength(1)
    expect(last.acceptedFiles[0]?.name).toBe("hello.txt")
  })

  it("file above maxFileSize is rejected with reason TOO_LARGE", () => {
    const onFileReject = vi.fn()
    render(<Basic maxFileSize={5} onFileReject={onFileReject} />)
    const dropzone = screen.getByTestId("dropzone")
    const file = makeFile("big.txt", 100)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    })
    expect(onFileReject).toHaveBeenCalled()
    const calls = onFileReject.mock.calls
    const detail = calls[calls.length - 1]?.[0] as FileUploadFileRejectDetails
    expect(detail.files).toHaveLength(1)
    expect(detail.files[0]?.reason).toBe("TOO_LARGE")
  })

  it("file with disallowed mime is rejected with reason FILE_INVALID_TYPE", () => {
    const onFileReject = vi.fn()
    render(<Basic accept="image/*" onFileReject={onFileReject} />)
    const dropzone = screen.getByTestId("dropzone")
    const file = makeFile("doc.txt", 10, "text/plain")
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    })
    expect(onFileReject).toHaveBeenCalled()
    const calls = onFileReject.mock.calls
    const detail = calls[calls.length - 1]?.[0] as FileUploadFileRejectDetails
    expect(detail.files[0]?.reason).toBe("FILE_INVALID_TYPE")
  })

  it("adding more than maxFiles rejects extras with TOO_MANY_FILES", () => {
    const onFileReject = vi.fn()
    render(<Basic maxFiles={2} onFileReject={onFileReject} />)
    const dropzone = screen.getByTestId("dropzone")
    const f1 = makeFile("a.txt", 10)
    const f2 = makeFile("b.txt", 10)
    const f3 = makeFile("c.txt", 10)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [f1, f2, f3], types: ["Files"] },
    })
    expect(onFileReject).toHaveBeenCalled()
    const calls = onFileReject.mock.calls
    const detail = calls[calls.length - 1]?.[0] as FileUploadFileRejectDetails
    expect(detail.files).toHaveLength(1)
    expect(detail.files[0]?.reason).toBe("TOO_MANY_FILES")
    expect(detail.files[0]?.file.name).toBe("c.txt")
  })

  it("item delete trigger removes the file", async () => {
    render(<Basic />)
    const dropzone = screen.getByTestId("dropzone")
    const file = makeFile("hello.txt", 10)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    })
    expect(screen.getByText("hello.txt")).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText("Remove hello.txt"))
    expect(screen.queryByText("hello.txt")).not.toBeInTheDocument()
  })

  it("clear trigger empties accepted files", async () => {
    render(<Basic />)
    const dropzone = screen.getByTestId("dropzone")
    const f1 = makeFile("a.txt", 10)
    const f2 = makeFile("b.txt", 10)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [f1, f2], types: ["Files"] },
    })
    expect(screen.getByText("a.txt")).toBeInTheDocument()
    expect(screen.getByText("b.txt")).toBeInTheDocument()
    await userEvent.click(screen.getByTestId("clear"))
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument()
    expect(screen.queryByText("b.txt")).not.toBeInTheDocument()
  })

  it("disabled blocks drop and trigger", async () => {
    const onFileChange = vi.fn()
    render(<Basic disabled onFileChange={onFileChange} />)
    const hidden = screen.getByTestId("hidden-input") as HTMLInputElement
    const clickSpy = vi.spyOn(hidden, "click")

    // Trigger button is disabled — userEvent skips the click.
    const trigger = screen.getByTestId("trigger") as HTMLButtonElement
    expect(trigger).toBeDisabled()

    // Drop attempt should not change accepted files.
    const dropzone = screen.getByTestId("dropzone")
    const file = makeFile("nope.txt", 10)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ["Files"] },
    })

    expect(clickSpy).not.toHaveBeenCalled()
    // onFileChange must not be invoked because addFiles was a no-op.
    expect(onFileChange).not.toHaveBeenCalled()
  })

  it("revokes object URLs created for image previews on unmount", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL")
    const file = makeFile("pic.png", 10, "image/png")
    const { unmount } = render(
      <FileUpload defaultAcceptedFiles={[file]}>
        <FileUploadItemGroup>
          <FileUploadItem file={file}>
            <FileUploadItemPreviewImage />
          </FileUploadItem>
        </FileUploadItemGroup>
      </FileUpload>,
    )
    expect(URL.createObjectURL).toHaveBeenCalled()
    unmount()
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock-url")
  })
})
