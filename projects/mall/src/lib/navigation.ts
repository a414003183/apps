import { getAccessToken, getStoredProfile } from '@apps/utils'

const WORKSPACE_URL = import.meta.env.VITE_WORKSPACE_URL ?? ''

export function navigateToWorkspace(path: string) {
  const targetOrigin = WORKSPACE_URL || window.location.origin
  const url = new URL(path, targetOrigin)
  const isCrossOrigin = url.origin !== window.location.origin

  if (isCrossOrigin) {
    const token = getAccessToken()
    const profile = getStoredProfile()

    if (token) {
      url.searchParams.set('_handoff_token', token)
    }

    if (profile) {
      const slim = {
        role: profile.role,
        identityType: profile.identityType,
        username: profile.username,
        name: profile.name,
        headline: profile.headline,
        route: profile.route,
        identities: profile.identities,
        memberLevel: profile.memberLevel,
      }

      url.searchParams.set('_handoff_profile', btoa(encodeURIComponent(JSON.stringify(slim))))
    }
  }

  window.location.href = url.toString()
}
