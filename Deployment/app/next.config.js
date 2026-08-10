/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivity: false,
  },
  // Item 11 (SSL): actual TLS termination happens at the host/reverse proxy,
  // not in application code — Next.js cannot originate HTTPS itself. What the
  // app *can* do is (a) tell browsers to always upgrade to HTTPS once they've
  // seen it once (HSTS) and (b) send the other baseline security headers
  // browsers use as trust signals. Gated behind an env flag rather than
  // always-on, because HSTS is a one-way ratchet — enabling it before the
  // production domain actually has a valid cert would lock users out.
  async headers() {
    if (process.env.ENABLE_HSTS !== "true") return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
