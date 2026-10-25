import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useFormik } from "formik"
import { useAppDispatch } from "@/store/hooks"
import { signedIn } from "@/store/authSlice"
import { useLoginMutation } from "@/services/endpoints/auth"
import { loginSchema } from "@/utils/schema"
import { routes } from "@/utils/routes"
import { FormikInput } from "@/components/shared/formik-input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { isProblem } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import { Lock, ArrowLeft, AlertCircle } from "lucide-react"

export function StaffLoginPage() {
  const [searchParams] = useSearchParams()
  const next = searchParams.get("next") || routes.staff.queue

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [generalError, setGeneralError] = useState<string | null>(null)

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setGeneralError(null)
      try {
        const res = await login({
          email: values.email,
          password: values.password,
        }).unwrap()

        dispatch(
          signedIn({
            token: res.accessToken,
            user: res.user,
            expiresInSeconds: res.expiresInSeconds,
          }),
        )

        navigate(next, { replace: true })
      } catch (err) {
        if (isProblem(err, "UNAUTHENTICATED")) {
          setGeneralError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setGeneralError(getErrorMessage(err))
        }
      }
    },
  })

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-soft text-primary border border-border shadow-2xs mb-2">
          <Lock className="size-7 stroke-[2.2]" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Staff Portal Sign In
        </h1>
        <p className="text-sm text-muted">
          Access the live outpatient queue, appointments calendar, and clinic operations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 shadow-xs space-y-6">
          <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormikInput
              name="email"
              type="email"
              label="Staff Email"
              required
              placeholder="staff@clinic.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
            />

            <FormikInput
              name="password"
              type="password"
              label="Password"
              required
              placeholder="••••••••"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? formik.errors.password : undefined}
            />

            {generalError && (
              <div
                role="alert"
                className="p-3.5 bg-danger-bg border border-danger/30 rounded-control text-xs text-danger font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full min-h-[44px] text-base font-semibold"
              loading={isLoading}
              disabled={isLoading}
            >
              Sign In to Staff Portal
            </Button>
          </form>

          <div className="text-center pt-3 border-t border-border-subtle">
            <Link
              to={routes.home}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Return to Patient Portal
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default StaffLoginPage
