import { createFileRoute } from "@tanstack/react-router"
import {
  QrCode,
  QrCodeFrame,
  QrCodeOverlay,
} from "darkraise-ui/components/qr-code"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/qr-code")({
  component: QrCodePage,
})

const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:John Doe",
  "TEL:+1234567890",
  "EMAIL:john@example.com",
  "END:VCARD",
].join("\n")

function UrlExample() {
  return <QrCode value="https://example.com" />
}

function VCardExample() {
  return <QrCode value={VCARD} level="M" size={220} />
}

function LogoOverlayExample() {
  return (
    <QrCode value="https://example.com" level="H" size={220}>
      <QrCodeFrame />
      <QrCodeOverlay>
        <span className="bg-background flex h-12 w-12 items-center justify-center rounded-md text-xs font-bold">
          DR
        </span>
      </QrCodeOverlay>
    </QrCode>
  )
}

function CustomColorsExample() {
  return (
    <QrCode value="https://example.com" fgColor="#1e3a8a" bgColor="#eff6ff" />
  )
}

function QrCodePage() {
  return (
    <ShowcasePage
      title="QrCode"
      description="An SVG QR code generator with a built-in encoder. Draws dark modules on white inside a four-module quiet zone so it scans in either theme, supports four error-correction levels, and has an absolutely-centered overlay slot for logos."
    >
      <ShowcaseExample
        title="URL"
        code={`<QrCode value="https://example.com" />`}
      >
        <UrlExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="vCard"
        code={`const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:John Doe",
  "TEL:+1234567890",
  "EMAIL:john@example.com",
  "END:VCARD",
].join("\\n")

<QrCode value={VCARD} level="M" size={220} />`}
      >
        <VCardExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="With logo overlay"
        code={`<QrCode value="https://example.com" level="H" size={220}>
  <QrCodeFrame />
  <QrCodeOverlay>
    <span className="bg-background flex h-12 w-12 items-center justify-center rounded-md text-xs font-bold">
      DR
    </span>
  </QrCodeOverlay>
</QrCode>`}
      >
        <LogoOverlayExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Custom colors"
        code={`// Keep dark modules on a light ground: most scanners cannot read the inverse.
<QrCode value="https://example.com" fgColor="#1e3a8a" bgColor="#eff6ff" />`}
      >
        <CustomColorsExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
