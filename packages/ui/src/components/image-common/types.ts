/**
 * Shared types between the image-cropper and image-editor packages. The
 * image-common module is the single source of truth; both cropper and
 * editor re-export these for compatibility with consumers that imported
 * them from those packages historically.
 */

export interface FileAcceptDetails {
  file: File
  dataUrl: string
}

export interface FileRejectDetails {
  file: File
  reason: "type" | "size"
}
