export function LiveRegion() {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="global-live-region"
    />
  )
}

export function announce(message: string) {
  const el = document.getElementById("global-live-region")
  if (el) {
    el.textContent = message
  }
}
