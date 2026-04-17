/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { 
  FileSearch, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  RefreshCw,
  Image as ImageIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface ComparisonItem {
  component: string;
  status: 'Khớp' | 'Sai lệch' | 'Thiếu';
  description: string;
  requirement: string;
}

interface ComparisonResult {
  items: ComparisonItem[];
  conclusion: 'ĐẠT' | 'KHÔNG ĐẠT';
  summary: string;
}

// --- Gemini Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function App() {
  const [reference, setReference] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'reference' | 'proof') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'reference') setReference(reader.result as string);
        else setProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompare = async () => {
    if (!reference || !proof) return;

    setIsComparing(true);
    setResult(null);
    setError(null);

    try {
      const referenceBase64 = reference.split(',')[1];
      const proofBase64 = proof.split(',')[1];

      const prompt = `Bạn là một Chuyên gia Kiểm soát Chất lượng (QC) kỳ cựu trong ngành in ấn thẻ tài chính và bảo mật. 
Nhiệm vụ của bạn là thực hiện quy trình đối soát nghiêm ngặt giữa "File Mẫu của Khách hàng" (Reference) và "File Laser Proof của Hãng" (Proof).

HÃY THỰC HIỆN CÁC BƯỚC:
1. Trích xuất toàn bộ nội dung văn bản (text), ký hiệu, logo, và các biểu tượng bảo mật trên cả hai file.
2. Căn chỉnh và chồng lớp ảo. Tự động xoay ảnh nếu cần để khớp bố cục.
3. So sánh chi tiết từng điểm: typography (font, size, spacing), màu sắc, vị trí, chip, payment logos (Visa/Mastercard/Napas), thông tin mặt sau (fine print).
4. Kiểm tra kỹ các nội dung chữ nhỏ ở mặt sau như Hotline, thông tin phát hành.

YÊU CẦU ĐẦU RA:
- Xuất kết quả dưới dạng JSON theo schema đã định sẵn.
- Ngôn ngữ: Tiếng Việt.
- Bôi đỏ bất kỳ sai lệch nào dù là nhỏ nhất.
- Conclusion: ĐẠT nếu giống 100%, KHÔNG ĐẠT nếu có bất kỳ sai lệch nào.

Lưu ý: Bỏ qua các đường ranh giới kỹ thuật (crop marks, bleed lines) hoặc ghi chú kỹ thuật bên ngoài thẻ.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { data: referenceBase64, mimeType: "image/png" } },
              { inlineData: { data: proofBase64, mimeType: "image/png" } }
            ]
          }
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
                    component: { type: Type.STRING, description: "Tên thành phần kiểm tra" },
                    status: { type: Type.STRING, enum: ["Khớp", "Sai lệch", "Thiếu"] },
                    description: { type: Type.STRING, description: "Mô tả chi tiết trạng thái hoặc lỗi" },
                    requirement: { type: Type.STRING, description: "Yêu cầu chỉnh sửa cụ thể cho hãng" }
                  },
                  required: ["component", "status", "description", "requirement"]
                }
              },
              conclusion: { type: Type.STRING, enum: ["ĐẠT", "KHÔNG ĐẠT"] },
              summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn kết quả đối soát" }
            },
            required: ["items", "conclusion", "summary"]
          }
        }
      });

      const parsedResult = JSON.parse(response.text) as ComparisonResult;
      setResult(parsedResult);
    } catch (err) {
      console.error("Comparison error:", err);
      setError("Đã xảy ra lỗi trong quá trình đối soát. Vui lòng thử lại với hình ảnh rõ nét hơn.");
    } finally {
      setIsComparing(false);
    }
  };

  const reset = () => {
    setReference(null);
    setProof(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-qc-bg text-qc-text-p font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-qc-border flex items-center justify-between px-6 bg-qc-panel sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <h1 className="text-lg font-bold tracking-tight">QC Đối Soát Laser Proof</h1>
          <div className="hidden sm:flex items-center gap-2">
            <span className="badge badge-id">Job ID: #PRT-{Math.random().toString(36).substring(7).toUpperCase()}</span>
            <span className="badge bg-qc-border/50 text-qc-text-s">Loại: Visa Platinum Debit</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {result && (
            <span className={`badge ${result.conclusion === 'ĐẠT' ? 'badge-status-success' : 'badge-status-danger'}`}>
              Kết quả: {result.conclusion}
            </span>
          )}
          <div className="text-right hidden md:block">
            <div className="text-qc-accent text-xs font-mono font-bold">CHUYÊN GIA: HỆ THỐNG QC AI</div>
            <div className="text-[10px] text-qc-text-s uppercase">{new Date().toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!result && !isComparing ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-qc-border"
            >
              {/* Reference Upload */}
              <section className="bg-qc-bg p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[11px] uppercase font-bold text-qc-text-s">01. File Mẫu Khách Hàng (Reference)</span>
                  <span className="font-mono text-[10px] text-qc-accent">X: 0.0, Y: 0.0</span>
                </div>
                <label className={`flex-1 relative group border border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${reference ? 'border-qc-success/50 bg-qc-panel' : 'border-qc-border hover:border-qc-accent hover:bg-qc-panel/50'}`}>
                  {reference ? (
                    <img src={reference} alt="Reference" className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-4 bg-qc-border/30 rounded-full group-hover:bg-qc-accent/20 transition-colors">
                        <Upload className="w-8 h-8 text-qc-text-s group-hover:text-qc-accent" />
                      </div>
                      <p className="mt-4 font-medium text-qc-text-p uppercase text-xs tracking-widest">Tải lên file thiết kế gốc</p>
                    </div>
                  )}
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'reference')} accept="image/*" />
                </label>
              </section>

              {/* Proof Upload */}
              <section className="bg-qc-bg p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[11px] uppercase font-bold text-qc-text-s">02. File Laser Proof Hãng (Candidate)</span>
                  <span className="font-mono text-[10px] text-qc-accent">ALIGNED: YES</span>
                </div>
                <label className={`flex-1 relative group border border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${proof ? 'border-qc-success/50 bg-qc-panel' : 'border-qc-border hover:border-qc-accent hover:bg-qc-panel/50'}`}>
                  {proof ? (
                    <img src={proof} alt="Proof" className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-4 bg-qc-border/30 rounded-full group-hover:bg-qc-accent/20 transition-colors">
                        <Upload className="w-8 h-8 text-qc-text-s group-hover:text-qc-accent" />
                      </div>
                      <p className="mt-4 font-medium text-qc-text-p uppercase text-xs tracking-widest">Tải lên Laser Proof của hãng</p>
                    </div>
                  )}
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'proof')} accept="image/*" />
                </label>

                {reference && proof && (
                  <button
                    onClick={handleCompare}
                    className="mt-8 bg-qc-accent text-white font-black text-xs uppercase tracking-widest py-4 rounded hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-qc-accent/20"
                  >
                    <FileSearch className="w-4 h-4" />
                    BẮT ĐẦU ĐỐI SOÁT KIẾM TRA
                  </button>
                )}
              </section>
              {error && (
                <div className="md:col-span-2 bg-qc-danger/10 border-t border-qc-danger/30 text-qc-danger px-6 py-2 text-xs font-bold text-center">
                  {error}
                </div>
              )}
            </motion.div>
          ) : isComparing ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-12 bg-qc-bg"
            >
              <div className="relative">
                <RefreshCw className="w-20 h-20 text-qc-accent animate-spin stroke-[1]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-qc-accent" />
                </div>
              </div>
              <h3 className="mt-8 text-xl font-black uppercase tracking-[0.2em] text-qc-accent animate-pulse">Scanning / Analyzing</h3>
              <p className="mt-4 text-qc-text-s text-xs font-mono max-w-sm text-center">
                CHỒNG LỚP ẢO / KIỂM TRA TYPOGRAPHY / Tọa độ Chip / Logo DeltaE...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col"
            >
              {/* Comparison Preview Top */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-qc-border h-auto md:h-80 box-border">
                <section className="bg-qc-bg p-6 flex flex-col">
                  <div className="pane-label flex justify-between items-center text-[11px] uppercase font-bold text-qc-text-s mb-4">
                    <span>Reference Image</span>
                    <span className="font-mono text-qc-accent">BASELINE</span>
                  </div>
                  <div className="card-preview-container flex-1">
                    <img src={reference!} className="w-full h-full object-contain" />
                  </div>
                </section>
                <section className="bg-qc-bg p-6 flex flex-col">
                  <div className="pane-label flex justify-between items-center text-[11px] uppercase font-bold text-qc-text-s mb-4">
                    <span>Candidate Proof</span>
                    <span className="font-mono text-qc-accent font-bold">ALIGNED (DRAFT)</span>
                  </div>
                  <div className="card-preview-container flex-1 overflow-hidden relative">
                    <img src={proof!} className="w-full h-full object-contain" />
                    {/* Simulated Diff Markers for decoration */}
                    {!isComparing && result?.conclusion === 'KHÔNG ĐẠT' && (
                      <div className="absolute top-1/4 left-1/4 w-16 h-12 border-2 border-qc-danger bg-qc-danger/10 animate-pulse rounded cursor-help" />
                    )}
                  </div>
                </section>
              </div>

              {/* Report & Verdict Bottom */}
              <div className="flex-1 flex flex-col md:flex-row bg-qc-panel border-t border-qc-border">
                {/* Table Section */}
                <section className="flex-1 p-6 overflow-x-auto">
                  <table className="w-full report-table">
                    <thead>
                      <tr>
                        <th>Thành phần</th>
                        <th className="w-24">Trạng thái</th>
                        <th>Mô tả chi tiết lỗi</th>
                        <th>Yêu cầu / Cảnh báo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result?.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-qc-text-p uppercase tracking-tighter">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-qc-accent" />
                              {item.component}
                            </div>
                          </td>
                          <td className="align-top">
                            <span className={`status-chip ${
                              item.status === 'Khớp' ? 'status-match' : 
                              item.status === 'Sai lệch' ? 'status-warning' : 'status-error'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="text-qc-text-s">{item.description}</td>
                          <td className={`font-medium ${item.status === 'Khớp' ? 'text-qc-text-s opacity-40' : 'text-qc-danger italic'}`}>
                            {item.requirement}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Verdict Aside */}
                <aside className="w-full md:w-64 border-l border-qc-border p-8 flex flex-col items-center justify-center text-center bg-qc-bg/50">
                  <div className="text-[11px] text-qc-text-s uppercase font-bold tracking-[0.2em] mb-4">Quyết định cuối cùng</div>
                  <div className={`verdict-box w-full ${result?.conclusion === 'ĐẠT' ? 'text-qc-success border-qc-success bg-qc-success/5 bg-qc-success/5' : 'text-qc-danger border-qc-danger bg-qc-danger/5'}`}>
                    {result?.conclusion}
                  </div>
                  <p className="mt-4 text-[11px] text-qc-text-s leading-relaxed italic">
                    "{result?.summary}"
                  </p>
                  <div className="mt-8 flex flex-col gap-2 w-full">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 bg-qc-panel border border-qc-border text-qc-text-p hover:bg-qc-border px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Xuất Báo Cáo
                    </button>
                    <button 
                      onClick={reset}
                      className="flex items-center justify-center gap-2 text-qc-text-s hover:text-qc-accent px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Làm mới
                    </button>
                  </div>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-10 border-t border-qc-border bg-qc-panel px-6 flex items-center justify-between text-[10px] text-qc-text-s uppercase font-mono tracking-widest">
        <span>© 2026 QC CARD PRO SYSTEM</span>
        <span className="opacity-50">Authorized for Financial Institution Standard</span>
      </footer>
    </div>
  );
}
