import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // self-contained server in .next/standalone, used by the Dockerfile
    output: "standalone",
    allowedDevOrigins: ['192.168.100.164'],
    async headers() {
        return [
            {
                // always fetch the latest service worker so updates roll out on the next visit
                source: '/sw.js',
                headers: [
                    { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Service-Worker-Allowed', value: '/' },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "example.com",
                port: "",
                pathname: "/**",
            }
        ]
    }
};

export default nextConfig;
