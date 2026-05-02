import { GoogleGenAI, Type } from "@google/genai";
import { QCReport, ComparisonStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeCardComparison(
  referenceBase64: string,
  proofBase64: string
): Promise<QCReport> {
  const model = "gemini-3.1-pro-preview";

  const prompt = `
Bạn là một Chuyên gia Kiểm soát Chất lượng (QC) kỳ cựu trong ngành in ấn thẻ tài chính và bảo mật.
Nhiệm vụ: Đối soát nghiêm ngặt giữa "File Mẫu của Khách hàng" (Reference) và "File Laser Proof của Hãng" (Proof).

Quy trình:
1. Trích xuất toàn bộ nội dung: text, ký hiệu, logo, biểu tượng bảo mật, chip, icon contactless.
2. Căn chỉnh và chồng lớp ảo: So sánh vị trí, typography (font, size, spacing), màu sắc.
3. So sánh chi tiết từng điểm. Ghi nhận bất kỳ sai lệch nào dù nhỏ nhất (lệch 1-2mm, font dày/mảnh hơn, sai chính tả).

Giới hạn:
- Chỉ tập trung vào Layout thẻ.
- Bỏ qua các đường ranh giới kỹ thuật (crop marks, bleed lines), thông số CMYK bên ngoài rìa.
- Kiểm tra kỹ chữ nhỏ (Fine print) ở mặt sau và các biểu tượng Napas, Mastercard, Visa...

Đầu ra yêu cầu định dạng JSON theo schema sau:
{
  "items": [
    {
      "component": "Tên thành phần (ví dụ: Logo Ngân hàng, Chip, Số thẻ...)",
      "status": "Khớp" | "Sai lệch" | "Thiếu",
      "description": "Mô tả chi tiết lỗi hoặc xác nhận khớp",
      "requirement": "Yêu cầu sửa đổi cụ thể nếu có",
      "boundingBox": {
        "x": 0-100,
        "y": 0-100,
        "width": 0-100,
        "height": 0-100
      }
    }
  ],
  "conclusion": "ĐẠT" | "KHÔNG ĐẠT",
  "overallSummary": "Tóm tắt tổng quan kết quả đối soát"
}

Lưu ý: "ĐẠT" chỉ khi 100% các thành phần là "Khớp".
`;

  const referencePart = {
    inlineData: {
      mimeType: referenceBase64.split(",")[0].split(":")[1].split(";")[0],
      data: referenceBase64.split(",")[1],
    },
  };

  const proofPart = {
    inlineData: {
      mimeType: proofBase64.split(",")[0].split(":")[1].split(";")[0],
      data: proofBase64.split(",")[1],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: "Đây là File Mẫu của Khách hàng (Reference):" },
            referencePart,
            { text: "Đây là File Laser Proof của Hãng (Proof):" },
            proofPart,
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  component: { type: Type.STRING },
                  status: {
                    type: Type.STRING,
                    enum: ["Khớp", "Sai lệch", "Thiếu"],
                  },
                  description: { type: Type.STRING },
                  requirement: { type: Type.STRING },
                  boundingBox: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      width: { type: Type.NUMBER },
                      height: { type: Type.NUMBER },
                    },
                    required: ["x", "y", "width", "height"],
                  },
                },
                required: ["component", "status", "description", "requirement", "boundingBox"],
              },
            },
            conclusion: {
              type: Type.STRING,
              enum: ["ĐẠT", "KHÔNG ĐẠT"],
            },
            overallSummary: { type: Type.STRING },
          },
          required: ["items", "conclusion", "overallSummary"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      timestamp: new Date().toLocaleString("vi-VN"),
      customerFile: referenceBase64,
      proofFile: proofBase64,
      ...result,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}
