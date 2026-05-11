/**
 * Read a File or Blob as a base64 data URL. Used by ImageDropzone and any
 * other consumer that needs to convert local file selection into a string
 * source for an <img> element.
 */
export function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("read error"))
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.readAsDataURL(file)
  })
}
