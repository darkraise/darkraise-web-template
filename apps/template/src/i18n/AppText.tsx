import { useAppTranslation } from "./useAppTranslation"

export function AppText({ text }: { text: string }) {
  const t = useAppTranslation()
  return t(text)
}
