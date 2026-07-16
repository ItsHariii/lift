import type { NextConfig } from "next";
import path from "node:path";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // stray lockfile in a parent dir confuses root inference — pin it here
  outputFileTracingRoot: path.join(__dirname),
  turbopack: { root: path.join(__dirname) },
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
