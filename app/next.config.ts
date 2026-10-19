import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Soal kuis ada di ../content (luar folder app) → ikutkan ke bundle server.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: { "/api/**": ["../content/**/*.json"] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: Object.fromEntries(
      [
        "@x402/core/client",
        "@x402/evm",
        "@x402/evm/exact/client",
        "@x402/evm/upto/client",
        "@x402/svm/exact/client",
      ].map((m) => [m, "./src/stubs/x402.ts"]),
    ),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
