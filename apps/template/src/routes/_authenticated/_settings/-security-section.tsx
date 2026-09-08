import { useAppTranslation } from "@/i18n/useAppTranslation"
import { useId, useState } from "react"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "darkraise-ui/components/alert-dialog"
import { Button } from "darkraise-ui/components/button"
import { Card, CardContent } from "darkraise-ui/components/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "darkraise-ui/components/input-otp"
import { Label } from "darkraise-ui/components/label"
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputField,
  PasswordInputIndicator,
  PasswordInputLabel,
  PasswordInputVisibilityTrigger,
} from "darkraise-ui/components/password-input"
import { toast } from "darkraise-ui/components/sonner"
import { Switch } from "darkraise-ui/components/switch"
import { FormSection } from "darkraise-ui/forms"

export function SecuritySection() {
  const t = useAppTranslation()

  const changePasswordHeadingId = useId()
  const mismatchMessageId = useId()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [twoFactorVerified, setTwoFactorVerified] = useState(false)

  return (
    <FormSection
      title={t("Security")}
      description={t(
        "Manage your password, two-factor authentication, and account deletion.",
      )}
    >
      <Card>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-2.5">
            <p id={changePasswordHeadingId} className="text-sm font-medium">
              {t("Change password")}
            </p>
            <div
              role="group"
              aria-labelledby={changePasswordHeadingId}
              className="grid gap-4 sm:grid-cols-2"
            >
              <PasswordInput>
                <PasswordInputLabel>{t("New password")}</PasswordInputLabel>
                <PasswordInputControl>
                  <PasswordInputField
                    placeholder={t("At least 8 characters")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordInputVisibilityTrigger>
                    <PasswordInputIndicator
                      visible={<EyeOff />}
                      hidden={<Eye />}
                    />
                  </PasswordInputVisibilityTrigger>
                </PasswordInputControl>
              </PasswordInput>
              <PasswordInput>
                <PasswordInputLabel>
                  {t("Confirm new password")}
                </PasswordInputLabel>
                <PasswordInputControl>
                  <PasswordInputField
                    placeholder={t("Re-enter password")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={mismatch || undefined}
                    aria-describedby={mismatch ? mismatchMessageId : undefined}
                  />
                  <PasswordInputVisibilityTrigger>
                    <PasswordInputIndicator
                      visible={<EyeOff />}
                      hidden={<Eye />}
                    />
                  </PasswordInputVisibilityTrigger>
                </PasswordInputControl>
              </PasswordInput>
            </div>
            <p
              id={mismatchMessageId}
              aria-live="polite"
              className="text-destructive text-xs"
              data-invalid={mismatch ? "true" : "false"}
            >
              {mismatch ? t("Passwords do not match.") : " "}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="security-2fa-toggle">
                  {t("Two-factor authentication")}
                </Label>
                <p className="text-muted-foreground text-sm">
                  {t(
                    "Require a verification code from your authenticator app when signing in.",
                  )}
                </p>
              </div>
              <Switch
                id="security-2fa-toggle"
                checked={twoFactorEnabled}
                onCheckedChange={(checked) => {
                  setTwoFactorEnabled(checked)
                  if (!checked) {
                    setOtpCode("")
                    setTwoFactorVerified(false)
                  }
                }}
              />
            </div>
            {twoFactorEnabled && (
              <div className="space-y-2">
                <Label htmlFor="security-2fa-otp">
                  {t("Verification code")}
                </Label>
                <InputOTP
                  id="security-2fa-otp"
                  aria-label={t("Verification code")}
                  maxLength={6}
                  value={otpCode}
                  onChange={(next) => {
                    setOtpCode(next)
                    if (next.length < 6) setTwoFactorVerified(false)
                  }}
                  onComplete={() => setTwoFactorVerified(true)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p aria-live="polite" className="text-muted-foreground text-xs">
                  {twoFactorVerified
                    ? t("Verified — two-factor authentication is active.")
                    : t("Enter the 6-digit code from your authenticator app.")}
                </p>
              </div>
            )}
          </div>

          <div className="border-destructive/40 space-y-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">{t("Delete account")}</p>
              <p className="text-muted-foreground text-sm">
                {t(
                  "Permanently remove your account and all associated data. This cannot be undone.",
                )}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("Delete account")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("Delete your account?")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "This will permanently delete your account and remove all associated data. This action is irreversible and cannot be undone.",
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      toast.success(
                        t("This is a demo — no account was deleted."),
                      )
                    }
                  >
                    {t("Delete account")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </FormSection>
  )
}
