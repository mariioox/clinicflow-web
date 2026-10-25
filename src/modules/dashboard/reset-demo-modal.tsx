import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/dialog"
import { useResetDemoDayMutation } from "@/services/endpoints/demo"
import { announce } from "@/components/shared/live-region"

export type ResetDemoModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ResetDemoModal({ isOpen, onClose }: ResetDemoModalProps) {
  const [resetDemoDay, { isLoading: isResetting }] = useResetDemoDayMutation()
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    setError(null)
    try {
      await resetDemoDay().unwrap()
      announce("Demo day data has been reset to initial seed state.")
      onClose()
    } catch {
      setError("Failed to reset demo day. Please try again.")
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setError(null)
          onClose()
        }
      }}
      tone="danger"
      title="Reset Demonstration Day"
      description="This action will clear all current bookings, walk-ins, and queue activity for today, re-seeding the database back to its clean initial demonstration state."
      confirmLabel="Confirm Reset"
      cancelLabel="Cancel"
      loading={isResetting}
      onConfirm={handleReset}
    >
      {error && <p className="mt-2 text-xs text-danger font-medium">{error}</p>}
    </ConfirmDialog>
  )
}
