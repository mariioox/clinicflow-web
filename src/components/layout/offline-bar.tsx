import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineBar() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="assertive"
      className="bg-danger text-on-danger px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm"
    >
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      <span>You are offline. Network requests and writes are paused until connection returns.</span>
    </div>
  )
}
