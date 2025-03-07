import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'img.clerk.com' }]
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      include: /src\/assets\/.*\.svg$/, // this allows icon.svg in app dir to work. All SVGs to be handled by SVGR are in src/assets
      use: ["@svgr/webpack"],
    });

    return config;
  },
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
