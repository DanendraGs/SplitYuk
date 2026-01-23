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

    // --- PROMPT SPESIAL DETEKSI WAJAH & BENDA ---
    const prompt = `
      Kamu adalah AI visual yang cerdas dan humoris. Tugasmu menganalisis gambar ini.

      LANGKAH ANALISIS:
      1. Cek apakah gambar ini adalah FOTO STRUK/TAGIHAN (Receipt)?
      2. Jika BUKAN struk, cek apakah ini FOTO WAJAH MANUSIA?
      3. Jika BUKAN keduanya, benda apakah ini?

      ATURAN OUTPUT (WAJIB JSON):

      KONDISI A: JIKA INI ADALAH STRUK/TAGIHAN
      Ekstrak data menu seperti biasa.
      {
        "status": "receipt",
        "items": [{ "name": "Nama Menu", "qty": 1, "price": 10000 }],
        "tax_total": 0,
        "service_total": 0
      }

      KONDISI B: JIKA INI WAJAH MANUSIA (SELFIE/FOTO ORANG)
      Berikan pujian yang menghibur, lucu, dan memotivasi (tentang orang sukses/kaya).
      {
        "status": "not_receipt",
        "message": "Waduh, maaf ini bukan struk! Tapi saya melihat aura orang sukses yang ganteng/cantik. Rezekinya lancar nih!"
      }
      (Variasikan kata-katanya agar tidak membosankan, puji visualnya).

      KONDISI C: JIKA INI BENDA LAIN (BUKAN STRUK, BUKAN ORANG)
      Sebutkan benda apa itu dengan nada santai.
      {
        "status": "not_receipt",
        "message": "Maaf, ini bukan struk tagihan. Ini sepertinya [NAMA BENDA]. Coba scan kertas tagihannya ya!"
      }
    `;

    // RETRY LOGIC
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
        attempt++;
        if (attempt < 3) await delay(1500);
      }
    }
    throw new Error("Gagal mengenali gambar.");

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return { error: "Gagal memproses gambar. Coba lagi ya." };
  }
}