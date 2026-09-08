import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app"
import { AppI18nProvider } from "darkraise-ui/i18n/react-i18next"
import { initializeAppI18n, appLocales, languageStorageKey } from "./i18n"
import "./styles/globals.css"

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!)
void initializeAppI18n()
  .then((instance) => {
    root.render(
      <StrictMode>
        <AppI18nProvider
          instance={instance}
          locales={appLocales}
          storageKey={languageStorageKey}
          syncDocument
        >
          <App />
        </AppI18nProvider>
      </StrictMode>,
    )
  })
  .catch(() => {
    root.render(
      <p role="alert">
        Unable to initialize the application. Please reload to try again.
      </p>,
    )
  })
