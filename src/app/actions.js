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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    // --- PROMPT YANG SUDAH DIPERTEGAS MATEMATIKANYA ---
    const prompt = `
      Kamu adalah AI visual yang sangat teliti dalam angka dan humoris.

      LANGKAH ANALISIS:
      1. Cek apakah gambar ini FOTO STRUK/TAGIHAN (Receipt)?
      2. Jika BUKAN, cek apakah FOTO WAJAH MANUSIA?
      3. Jika BUKAN keduanya, benda apa ini?

      --- ATURAN OUTPUT (WAJIB JSON) ---

      KONDISI A: JIKA INI ADALAH STRUK (RECEIPT)
      Ekstrak data menu dengan aturan MATEMATIKA berikut:
      
      ⚠️ INSTRUKSI SANGAT PENTING (HARGA):
      1. Field "price" WAJIB berisi HARGA TOTAL PER BARIS (Line Amount).
      2. Rumus: "price" = Qty x Harga Satuan.
      3. CONTOH KASUS: 
         - Jika tertulis "2 Es Teh @ 15.000 ... 30.000".
         - Maka Output HARUS: { "name": "Es Teh", "qty": 2, "price": 30000 }
         - JANGAN isi 15000. Ambil angka paling kanan (Totalnya).
      4. Abaikan 'Subtotal', 'Total', 'Cash', 'Kembali' dalam daftar items.
      5. Pisahkan Tax & Service ke field terpisah.

      Output JSON Struk:
      {
        "status": "receipt",
        "items": [
           { "name": "Nama Menu", "qty": 2, "price": 80000 } 
        ],
        "tax_total": 5000, 
        "service_total": 0
      }
      (Pastikan "price" adalah angka murni tanpa titik/koma).

      KONDISI B: JIKA INI WAJAH MANUSIA
      Berikan pujian humoris tentang aura kesuksesan/kekayaan.
      {
        "status": "not_receipt",
        "message": "Waduh, ini bukan struk! Tapi saya melihat wajah calon miliarder di sini. Aura glowing-nya ngalahin layar HP!"
      }

      KONDISI C: JIKA BENDA LAIN
      Sebutkan benda apa itu.
      {
        "status": "not_receipt",
        "message": "Maaf, ini bukan struk. Ini sepertinya [NAMA BENDA]. Coba scan kertas tagihannya yang ada angkanya ya!"
      }
    `;

    // RETRY LOGIC (Mencoba 3x jika gagal)
    let attempt = 0;
    while (attempt < 3) {
      try {
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: file.type } },
        ]);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(text);

        return { success: true, data: data };
      } catch (err) {
        console.warn(`Attempt ${attempt+1} failed:`, err.message);
        attempt++;
        if (attempt < 3) await delay(1500);
      }
    }
    throw new Error("Gagal mengenali gambar setelah 3x percobaan.");

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return { error: "Gagal memproses gambar. Pastikan internet stabil." };
  }
}
