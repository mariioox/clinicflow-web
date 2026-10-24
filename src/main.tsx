import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"

import { store, persistor } from "@/store"
import { router } from "@/router"
import { LiveRegion } from "@/components/shared/live-region"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
        <LiveRegion />
        <Toaster position="bottom-right" richColors />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
