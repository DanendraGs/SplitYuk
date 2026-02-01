/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Biarkan build berhasil meskipun ada warning/error kecil (seperti variabel tak terpakai)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
