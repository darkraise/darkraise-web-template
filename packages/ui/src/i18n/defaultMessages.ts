import { defaultLabels } from "../labels/defaults"
import type { UiMessages } from "./types"
import { controlMessages } from "./controlMessages"
import { themeMessages } from "./themeMessages"
import { DEFAULT_TRANSLATIONS } from "../components/image-cropper/types"

export const defaultMessages: UiMessages = {
  ...defaultLabels,
  controls: controlMessages,
  themeOptions: themeMessages,
  imageCropper: DEFAULT_TRANSLATIONS,
  dateInput: { year: "Year", month: "Month", day: "Day" },
  dateInputPlaceholder: { year: "YYYY", month: "MM", day: "DD" },
  announcements: {
    remove: (name) => `Remove ${name}`,
    select: (name) => `Select ${name}`,
    expand: (name) => `Expand ${name}`,
    collapse: (name) => `Collapse ${name}`,
    slide: (index) => `Go to slide ${index}`,
    contributions: (count, date) =>
      `${count} ${count === 1 ? "contribution" : "contributions"} on ${date}`,
    rating: (value) => `${value} ${value === 1 ? "star" : "stars"}`,
  },
  common: {
    language: "Language",
  },
}
