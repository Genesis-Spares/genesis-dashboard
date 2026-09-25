import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // self-contained server in .next/standalone, used by the Dockerfile
    output: "standalone",
    allowedDevOrigins: ['192.168.100.164'],
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
