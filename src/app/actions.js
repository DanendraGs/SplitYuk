'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeReceipt(formData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "API Key Gemini hilang." };

  const file = formData.get("file");
  if (!file) return { error: "File gambar tidak ada." };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Tetap gunakan model preview yang kamu pilih (atau gemini-1.5-flash-latest)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    // --- PROMPT BARU YANG LEBIH CERDAS ---
    const prompt = `
      Kamu adalah mesin kasir AI profesional. Tugasmu adalah mengekstrak data dari foto struk ini.

      INSTRUKSI PENTING:
      1. **ITEMS**: Ambil semua menu makanan/minuman.
         - Format: { "name": "Nama Menu", "qty": 1, "price": 15000 }
         - "price" adalah HARGA TOTAL per baris (Harga Satuan x Qty).
         - Perbaiki nama menu yang disingkat agar mudah dibaca.
      
      2. **IGNORE (JANGAN MASUKKAN KE ITEMS)**:
         - Jangan masukkan baris yang berisi: "Subtotal", "Total", "Kembali", "Cash", "Debit".
         - SANGAT PENTING: Jangan masukkan "Pajak", "Tax", "PB1", "PPN", "Service Charge", "SC", "Layanan" ke dalam array 'items'. Ini harus dipisah.

      3. **TAX & SERVICE**:
         - Cari total nominal Pajak (Tax/PB1/VAT).
         - Cari total nominal Service Charge (Layanan) jika ada.
      
      OUTPUT JSON WAJIB (Hanya JSON, tanpa markdown):
      {
        "items": [
          { "name": "Nasi Goreng", "qty": 2, "price": 30000 },
          { "name": "Es Teh", "qty": 1, "price": 5000 }
        ],
        "tax_total": 3500,
        "service_total": 0
      }
    `;

    // --- LOGIKA AUTO-RETRY (3x Percobaan) ---
    let attempt = 0;
    let maxRetries = 3;
    let lastError = null;

    while (attempt < maxRetries) {
      try {
        console.log(`AI Membaca Struk (Percobaan ${attempt + 1})...`);
        
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: file.type } },
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Bersihkan JSON dari format markdown ```json ... ```
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanText);

        // Validasi data sedikit
        if (!data.items || !Array.isArray(data.items)) {
          throw new Error("Format JSON tidak valid");
        }

        return { success: true, data: data };

      } catch (err) {
        console.warn(`Gagal percobaan ke-${attempt + 1}:`, err.message);
        lastError = err;
        attempt++;
        if (attempt < maxRetries) await delay(2000); // Tunggu 2 detik
      }
    }

    throw lastError;

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return { error: "Gagal membaca struk. Pastikan foto jelas dan coba lagi." };
  }
}