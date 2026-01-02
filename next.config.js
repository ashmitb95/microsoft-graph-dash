/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    TENANT_ID: process.env.TENANT_ID,
    JWT_SECRET: process.env.JWT_SECRET || process.env.SESSION_SECRET,
    REDIRECT_URI: process.env.REDIRECT_URI,
  },
};

module.exports = nextConfig;

