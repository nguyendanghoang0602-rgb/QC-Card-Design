/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, Loader2, Info } from "lucide-react";
import FileUploader from "./components/FileUploader";
import ReportView from "./components/ReportView";
import { analyzeCardComparison } from "./services/aiService";
import { QCReport } from "./types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [customerFile, setCustomerFile] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<QCReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartAnalysis = async () => {
    if (!customerFile || !proofFile) return;

    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeCardComparison(customerFile, proofFile);
      setReport(result);
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi trong quá trình phân tích. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCustomerFile(null);
    setProofFile(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-xl">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-slate-800">Smart Card QC Expert</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Hệ thống Đối soát Thẻ Tài chính v1.0</p>
          </div>
        </div>
        {report && (
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
              report.conclusion === "ĐẠT" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
              : "bg-red-50 text-red-700 border-red-200"
            }`}>
              KẾT LUẬN: {report.conclusion}
            </div>
            <button
              onClick={reset}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
              id="new-check-btn"
            >
              Kiểm tra mới
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!report ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center"
            >
              <div className="text-center max-w-2xl mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight uppercase">
                  Quy trình Đối soát Chất lượng
                </h2>
                <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <FileUploader
                    label="File Mẫu của Khách hàng (Reference)"
                    onFileSelect={setCustomerFile}
                  />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <FileUploader
                    label="File Laser Proof của Hãng (Proof)"
                    onFileSelect={setProofFile}
                  />
                </div>
              </div>

              {error && (
                <div className="w-full max-w-5xl mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 shadow-sm">
                  <Info className="w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button
                onClick={handleStartAnalysis}
                disabled={!customerFile || !proofFile || isAnalyzing}
                className={`group flex items-center justify-center gap-4 px-12 py-5 rounded-2xl text-lg font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] ${
                  !customerFile || !proofFile || isAnalyzing
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-200"
                }`}
                id="start-analysis-btn"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý AI Matrix...
                  </>
                ) : (
                  <>
                    Phân tích đối soát
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )
              }
              </button>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cảm biến</div>
                  <div className="text-xs font-bold text-slate-700 uppercase">Detection accuracy 99.9%</div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Xử lý</div>
                  <div className="text-xs font-bold text-slate-700 uppercase">Virtual Overlay Engine</div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bảo mật</div>
                  <div className="text-xs font-bold text-slate-700 uppercase">ISO Safety Compliant</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.8, bounce: 0.2 }}
            >
              <ReportView report={report} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto flex justify-between items-center text-[10px] text-slate-400 mt-12 px-2 uppercase font-bold tracking-widest">
        <div className="flex gap-6">
          <span>QC Specialist: AI AGENT</span>
          <span>SYSTEM VER: 2.5.0</span>
        </div>
        <div className="font-mono">CRYPTO-SHIELD VALIDATED</div>
      </footer>
    </div>
  );
}

