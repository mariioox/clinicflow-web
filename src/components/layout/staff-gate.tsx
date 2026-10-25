import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { signedOut } from "@/store/authSlice"
import { routes } from "@/utils/routes"
import { env } from "@/utils/env"

export type StaffGateProps = {
  children: ReactNode
}

export function StaffGate({ children }: StaffGateProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAppSelector((state) => state.auth)

  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthorized" | "forbidden">("checking")
  const [forbiddenMessage, setForbiddenMessage] = useState("")

  useEffect(() => {
    // 1. Check expiresAt first without spending a request if already expired
    if (!auth.token || !auth.expiresAt || Date.now() > auth.expiresAt) {
      dispatch(signedOut())
      navigate(`${routes.staff.login}?next=${encodeURIComponent(location.pathname)}`, { replace: true })
      return
    }

    // 2. Confirm session with getMe endpoint
    let isMounted = true
    fetch(`${env.apiBaseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "X-Request-Id": crypto.randomUUID(),
      },
    })
      .then(async (res) => {
        if (!isMounted) return
        if (res.status === 401) {
          // Only 401 signs staff out
          dispatch(signedOut())
          navigate(`${routes.staff.login}?next=${encodeURIComponent(location.pathname)}`, { replace: true })
          return
        }
        if (res.status === 403) {
          const body = await res.json().catch(() => ({ detail: "Access denied" }))
          setForbiddenMessage(body.detail || "You do not have permission to view this page.")
          setStatus("forbidden")
          return
        }
        if (!res.ok) {
          // Other unexpected errors — treat cautiously or retry, but for gate let's assume valid or show retry
          setStatus("authenticated")
          return
        }
        setStatus("authenticated")
      })
      .catch(() => {
        if (isMounted) {
          // Network error during gate check — allow cached session if not expired, or show warning
          setStatus("authenticated")
        }
      })

    return () => {
      isMounted = false
    }
  }, [auth.token, auth.expiresAt, dispatch, location.pathname, navigate])

  if (status === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text p-4">
        <div className="flex items-center gap-3">
          <svg className="size-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Verifying staff session…</span>
        </div>
      </div>
    )
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text p-4">
        <div className="max-w-md w-full bg-surface border border-border p-6 rounded-control shadow-sm text-center">
          <h1 className="text-lg font-bold text-danger mb-2">Access Forbidden</h1>
          <p className="text-sm text-muted mb-4">{forbiddenMessage}</p>
          <button
            onClick={() => navigate(routes.staff.queue)}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-control hover:bg-primary-hover"
          >
            Return to Live Queue
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
