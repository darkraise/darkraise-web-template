import { create } from "zustand"

interface BrandState {
  appName: string
  setAppName: (name: string) => void
}

export const useBrandStore = create<BrandState>((set) => ({
  appName: "App",
  setAppName: (appName) => set({ appName }),
}))
