import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Auto-load root .env into process.env if variables aren't already set
try {
  const rootEnvPath = path.resolve(process.cwd(), "../.env");
  if (fs.existsSync(rootEnvPath)) {
    const content = fs.readFileSync(rootEnvPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
} catch {
  // Silent fallback
}

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
