import type { NextConfig } from "next";

// When using `next dev` behind a public hostname (e.g. Coolify), Turbopack blocks
// cross-origin HMR unless the host is listed here (hostnames only, no protocol).
const allowedDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((h) => h.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
