import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  // 1. JUDUL & DESKRIPSI UTAMA
  title: "SplitYuk - Scan Struk & Bagi Tagihan Otomatis",
  description: "Aplikasi split bill paling gampang. Cukup foto struk makan, AI akan memisahkan harga, pajak, dan service charge secara otomatis. Anti ribet!",

  // 2. VERIFIKASI GOOGLE (Wajib agar terdaftar di Search Console)
  verification: {
    google: "9G-L9yP2bQFUTKp8NdLx6UADAZK0ZtpIIOuSVe4txUg",
  },

  // 3. KATA KUNCI (Agar mudah dicari)
  keywords: ["split bill", "bagi tagihan", "scan struk", "patungan makan", "ocr struk", "aplikasi split bill indonesia", "hitung pajak service"],

  // 4. INFO PENULIS
  authors: [{ name: "SplitYuk Team" }],

  // 5. TAMPILAN SAAT DI-SHARE (WhatsApp, Twitter, FB)
  openGraph: {
    title: "SplitYuk - Bayar Patungan Gak Pake Ribet",
    description: "Scan struk pake AI, langsung keluar rincian siapa bayar berapa.",
    url: "https://splityuk.vercel.app", // (Opsional) Ganti dengan domain aslimu nanti
    siteName: "SplitYuk",
    locale: "id_ID",
    type: "website",
  },

  // 6. IZIN ROBOT GOOGLE
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    // Saya ubah 'en' jadi 'id' karena konten aplikasimu Bahasa Indonesia
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}