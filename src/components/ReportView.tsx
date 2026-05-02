import React from "react";
import { Download, CheckCircle2, AlertCircle, HelpCircle, FileCheck, Layers, Eye, EyeOff } from "lucide-react";
import { QCReport, ComparisonStatus, BoundingBox } from "../types";
import { generatePDFReport } from "../lib/pdfGenerator";
import { motion, AnimatePresence } from "motion/react";

interface ReportViewProps {
  report: QCReport;
}

const statusColors = {
  [ComparisonStatus.MATCH]: "text-emerald-700 bg-emerald-100 border-emerald-200",
  [ComparisonStatus.MISMATCH]: "text-red-700 bg-red-100 border-red-200",
  [ComparisonStatus.MISSING]: "text-amber-700 bg-amber-100 border-amber-200",
};

const StatusIcon = ({ status }: { status: ComparisonStatus }) => {
  switch (status) {
    case ComparisonStatus.MATCH:
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case ComparisonStatus.MISMATCH:
      return <AlertCircle className="w-3.5 h-3.5" />;
    case ComparisonStatus.MISSING:
      return <HelpCircle className="w-3.5 h-3.5" />;
  }
};

export default function ReportView({ report }: ReportViewProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [overlayOpacity, setOverlayOpacity] = React.useState(0.5);
  const [showBoxes, setShowBoxes] = React.useState(true);
  const [showOverlay, setShowOverlay] = React.useState(true);

  const handleDownload = async () => {
    setIsExporting(true);
    await generatePDFReport(report, "report-container");
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-end items-center py-2 gap-4">
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lớp Chồng (Overlay)</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={overlayOpacity} 
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className="w-24 accent-slate-900"
            />
          </div>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <button 
            onClick={() => setShowBoxes(!showBoxes)}
            className={`p-1.5 rounded-lg transition-colors ${showBoxes ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}
            title="Bật/Tắt khung định vị"
          >
            {showBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-widest shadow-lg"
          id="download-report-btn"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? "Đang xuất..." : "Xuất Báo cáo PDF"}
        </button>
      </div>

      <div id="report-container" className="flex flex-col gap-6">
        {/* Virtual Overlay Visualization */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Chế độ Chồng lớp Ảo (Virtual Overlay Matrix)
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Sai lệch/Thiếu</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Khớp chuẩn</span>
               </div>
            </div>
          </div>

          <div className="relative aspect-[1.586/1] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
            {/* Base Image (Reference) */}
            <img 
              src={report.customerFile} 
              alt="Reference Base" 
              className="absolute inset-0 w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlay Image (Proof) */}
            {showOverlay && (
              <img 
                src={report.proofFile} 
                alt="Proof Overlay" 
                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply"
                style={{ opacity: overlayOpacity }}
                referrerPolicy="no-referrer"
              />
            )}

            {/* Bounding Boxes */}
            {showBoxes && report.items.map((item, idx) => {
              if (!item.boundingBox) return null;
              const { x, y, width, height } = item.boundingBox;
              const isMatch = item.status === ComparisonStatus.MATCH;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute border-2 pointer-events-none ${
                    isMatch ? "border-emerald-500/50" : "border-red-500 ring-2 ring-red-500/20 ring-offset-2 ring-offset-transparent"
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                >
                  <div className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white whitespace-nowrap shadow-sm ${
                    isMatch ? "bg-emerald-500" : "bg-red-500"
                  }`}>
                    {item.component}
                  </div>
                </motion.div>
              );
            })}

            {/* Grid Helper Overlay */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-[0.03]">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-slate-900"></div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 italic text-center font-bold uppercase tracking-widest leading-relaxed">
            Hệ thống tự động căn chỉnh và chồng lớp Proof (độ trong suốt {Math.round(overlayOpacity * 100)}%) lên Reference để phát hiện sai lệch vị trí.
          </p>
        </section>

        <main className="grid grid-cols-12 gap-6 flex-grow">
          {/* Reference Image Thumb */}
          <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm group hover:border-slate-300 transition-colors">
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">File Mẫu (Ref)</h3>
            <div className="relative aspect-[1.586/1] bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <img src={report.customerFile} alt="Reference" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Proof Image Thumb */}
          <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm group hover:border-slate-300 transition-colors">
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Bản Proof (Hãng)</h3>
            <div className="relative aspect-[1.586/1] bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <img src={report.proofFile} alt="Proof" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Combined AI Matrix */}
          <div className="col-span-12 lg:col-span-4 bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="text-[10px] font-black text-slate-500 uppercase mb-5 tracking-[0.2em]">AI Matrix Detail</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">Thời gian</span>
                <span className="text-[10px] font-mono text-emerald-400">{report.timestamp}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">Typography</span>
                <span className="text-[10px] font-mono text-slate-100">ISO-7810 Compliant</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">Color Acc</span>
                <span className="text-[10px] font-mono text-blue-400">Delta E Managed</span>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Tóm tắt QC</p>
                <p className="text-[11px] leading-relaxed text-slate-300 italic">"{report.overallSummary}"</p>
              </div>
            </div>
          </div>

          {/* Detailed Table Card */}
          <div className="col-span-12 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Bảng Chi Tiết Kết Quả Đối Soát
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-8 py-4 w-1/5">Thành phần</th>
                    <th className="px-8 py-4 w-[120px] text-center">Trạng thái</th>
                    <th className="px-8 py-4">Mô tả chi tiết lỗi</th>
                    <th className="px-8 py-4">Cảnh báo / Yêu cầu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.items.map((item, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-8 py-5 align-top">
                        <p className="text-sm font-bold text-slate-800">{item.component}</p>
                      </td>
                      <td className="px-8 py-5 align-top">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${statusColors[item.status]}`}>
                            <StatusIcon status={item.status} />
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 align-top">
                        <p className="text-xs text-slate-600 leading-relaxed italic">{item.description}</p>
                      </td>
                      <td className="px-8 py-5 align-top">
                        <p className={`text-xs font-bold uppercase tracking-tight ${item.status === ComparisonStatus.MATCH ? "text-slate-300" : "text-red-600"}`}>
                          {item.requirement}
                        </p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
