import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@marsad/shared"],
  async rewrites() {
    // Proxy browser API calls through this same origin instead of hitting
    // the API's separate Railway subdomain directly. Railway's *.up.railway.app
    // subdomains are each their own "site" per the Public Suffix List, so the
    // auth cookie (sameSite: none) is a third-party cookie from the browser's
    // point of view — Safari and other browsers with strict cross-site cookie
    // blocking drop it, breaking login. Routing through /api keeps everything
    // same-origin so the cookie is a normal first-party cookie everywhere.
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
