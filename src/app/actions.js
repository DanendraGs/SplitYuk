'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function analyzeReceipt(formData) {
  const file = formData.get('file')
  if (!file) return { error: 'File tidak ditemukan' }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Image = buffer.toString('base64')

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview'
    })

    const prompt = `
Kamu adalah AI analisis struk restoran Indonesia.

Dari gambar struk ini, ekstrak data berikut.
Balas HANYA JSON VALID.

Format:
{
  "items": [
    { "name": string, "qty": number, "price": number }
  ],
  "tax": number,
  "service": number,
  "total": number
}

Harga dalam rupiah angka saja.
Jika tidak ada, isi 0.
`

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type
        }
      },
      prompt
    ])

    const responseText = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch {
      return { error: 'AI gagal membaca struk' }
    }

    return {
      success: true,
      data: parsed
    }

  } catch (err) {
    console.error(err)
    return { error: 'Gagal memproses struk' }
  }
}
