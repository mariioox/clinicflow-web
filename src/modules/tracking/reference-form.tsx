import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { routes } from "@/utils/routes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export type ReferenceFormProps = {
  initialValue?: string
}

export function ReferenceForm({ initialValue = "" }: ReferenceFormProps) {
  const [reference, setReference] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = reference.trim().toUpperCase()

    if (!trimmed) {
      setError("Please enter your booking reference number")
      return
    }

    // Format is CF-XXXX-XXXX
    const pattern = /^CF-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    if (!pattern.test(trimmed)) {
      setError("Reference must be in format CF-XXXX-XXXX (e.g. CF-7K3Q-9XMD)")
      return
    }

    setError(null)
    navigate(routes.trackRef(trimmed))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="ref-input" className="block text-sm font-medium text-text">
          Enter Your Booking Reference <span className="text-danger">*</span>
        </label>
        <div className="flex gap-2">
          <Input
            id="ref-input"
            type="text"
            placeholder="e.g. CF-7K3Q-9XMD"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value)
              if (error) setError(null)
            }}
            aria-describedby={error ? "ref-error" : "ref-hint"}
            aria-invalid={!!error}
            className="font-mono text-base uppercase flex-1"
          />
          <Button type="submit" variant="primary" size="md" className="rounded-full px-6 min-h-[44px]">
            <Search className="size-4 mr-1.5" />
            Track
          </Button>
        </div>
        <p id="ref-hint" className="text-xs text-muted">
          Your 10-character reference was provided on your booking confirmation.
        </p>
        {error && (
          <p id="ref-error" className="text-xs text-danger font-medium mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
