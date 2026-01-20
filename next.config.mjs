/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. PINDAHKAN KE SINI (Di luar 'experimental')
  // Ubah namanya jadi 'serverExternalPackages' (sesuai pesan error)
  serverExternalPackages: ['tesseract.js'],

  experimental: {
    // 2. Pengaturan Upload Besar tetap di sini
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;