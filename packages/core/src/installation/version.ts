declare global {
  const KIWII_VERSION: string
  const KIWII_CHANNEL: string
}

export const InstallationVersion = typeof KIWII_VERSION === "string" ? KIWII_VERSION : "local"
export const InstallationChannel = typeof KIWII_CHANNEL === "string" ? KIWII_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
