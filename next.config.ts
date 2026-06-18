import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow larger payloads for the demo-mode / photo server-action upload path.
    // (Admin media uploads go directly to Supabase Storage, bypassing this.)
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
