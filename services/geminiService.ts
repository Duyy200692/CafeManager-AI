import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeExcelImage = async (base64Image: string): Promise<Partial<AppState>> => {
  try {
    const prompt = `
      Bạn là một chuyên gia phân tích dữ liệu tài chính F&B (quán cafe).
      Nhiệm vụ của bạn là trích xuất dữ liệu từ hình ảnh bảng tính Excel được cung cấp.

      Hãy cố gắng trích xuất các trường dữ liệu chi tiết sau đây cho từng ngày (nếu có):
      
      **1. Doanh thu:**
      - Doanh thu tổng (Total Revenue)
      - Doanh thu ca sáng (Morning Revenue)
      - Doanh thu ca tối (Evening Revenue)
      - Chiết khấu/Giảm giá (Discounts)
      - Doanh thu Net (Net Revenue)

      **2. Chi phí NVL (COGS):**
      - Chi phí NVL Cost (Theo định mức %)
      - Chi phí NVL nhập trong tháng (Import)
      - Chi phí Hàng hủy (Waste)

      **3. Chi phí Nhân sự:**
      - Tiền lương (Salary)
      - Tiền thưởng (Bonus)
      - Phụ cấp (Allowance)

      **4. Chi phí Khác:**
      - Marketing
      - Chi phí CCDC (Công cụ dụng cụ)
      - Vật liệu tiêu hao
      - Chi phí bằng tiền khác
      
      **5. Chi tiết Món Bán Ra (Sales Mix) - QUAN TRỌNG:**
      - Nếu trong ảnh có bảng danh sách các món nước đã bán, hãy trích xuất tên món, số lượng bán và tổng tiền.
      - Nếu không có cột tổng tiền, hãy ước lượng hoặc để 0.
      - Cố gắng lấy Top 5-10 món bán chạy nhất nếu danh sách quá dài.

      **Định dạng JSON trả về:**
      {
        "businessResults": [
          { 
            "date": "YYYY-MM-DD", 
            "totalRevenue": number,
            "morningRevenue": number,
            "eveningRevenue": number,
            "discounts": number,
            "netRevenue": number,
            "costOfGoodsSold": number,
            "costOfGoodsImport": number,
            "wasteCost": number,
            "staffSalary": number,
            "staffBonus": number,
            "staffAllowance": number,
            "marketing": number,
            "tools": number,
            "consumables": number,
            "otherCash": number,
            "netProfit": number
          }
        ],
        "staffPayroll": [
          { "name": "string", "totalHours": number, "salary": number, "role": "string" }
        ],
        "salesDetails": [
           { "itemName": "string", "quantity": number, "revenue": number }
        ]
      }

      Lưu ý:
      - Nếu ô trống hoặc không có số liệu, hãy để giá trị là 0.
      - Chuyển đổi số tiền (ví dụ: 1.200.000) thành số nguyên (1200000).
      - Nếu ảnh mờ, hãy ước lượng dựa trên tổng.
      - Đối với salesDetails, hãy gán ngày của món hàng trùng với ngày của businessResult.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được phản hồi từ Gemini.");

    try {
      const parsedData = JSON.parse(text);
      
      // Post-processing to ensure all fields exist and calculate totals
      if (parsedData.businessResults) {
        parsedData.businessResults = parsedData.businessResults.map((item: any) => ({
           ...item,
           staffTotalCost: (item.staffSalary || 0) + (item.staffBonus || 0) + (item.staffAllowance || 0),
           operatingTotalCost: (item.marketing || 0) + (item.tools || 0) + (item.consumables || 0) + (item.otherCash || 0)
        }));
      }
      
      // Map sales details date if not present
      if (parsedData.salesDetails && parsedData.businessResults && parsedData.businessResults.length > 0) {
         const date = parsedData.businessResults[0].date;
         parsedData.salesDetails = parsedData.salesDetails.map((item: any) => ({
           ...item,
           date: date,
           id: `${date}-${item.itemName.replace(/\s+/g, '_')}`
         }));
      }

      return parsedData;
    } catch (e) {
      console.error("Lỗi parse JSON từ Gemini:", e);
      throw new Error("Không thể đọc dữ liệu từ hình ảnh. Vui lòng thử lại với ảnh rõ nét hơn.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
