// This file exposes build-time configuration
// The BUILD_TIMESTAMP is injected during the build process via environment variable

export const BUILD_CONFIG = {
  deployDate: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString(),
} as const;
