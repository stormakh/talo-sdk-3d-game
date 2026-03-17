import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/race/:raceId",
        destination: "/horse-race/race/:raceId",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/horse-race/register",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
