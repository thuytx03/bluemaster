import { ESocialProvider } from "src/constants/enum"
import useAuthStore from "src/stores/auth.store"

/**
 * Adapter with the shape of xthuy-social's `useFacebook()` so the ported hooks
 * keep reading `profile.uid` / `profile.fb_dtsg`, backed by Bluemaster's
 * verified account in `useAuthStore` (no second session loader).
 */
export function useFacebook() {
  const account = useAuthStore((s) => s.accounts[ESocialProvider.FACEBOOK])
  const profile = account
    ? {
        uid: account.id,
        name: account.name,
        avatar: account.avatar,
        fb_dtsg: account.fbDtsg
      }
    : null
  return { profile, isLoggedIn: !!account }
}
