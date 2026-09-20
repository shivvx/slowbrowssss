import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow tunnel domains and mobile hotspots for live testing
  allowedDevOrigins: [
    '*.loca.lt',
    '*.serveousercontent.com',
    '*.localhost.run',
    '192.168.3.1',
    'localhost:3000'
  ]
};

export default nextConfig;
