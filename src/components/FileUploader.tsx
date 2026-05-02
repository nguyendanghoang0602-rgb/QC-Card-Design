import React, { useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FileUploaderProps {
  label: string;
  onFileSelect: (base64: string) => void;
  accept?: string;
}

export default function FileUploader({
  label,
  onFileSelect,
  accept = "image/*,application/pdf",
}: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        onFileSelect(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const clearFile = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</h3>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center bg-slate-50 overflow-hidden ${
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-200 hover:border-slate-400 hover:bg-slate-100"
        }`}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full flex flex-col items-center"
            >
              {preview.startsWith("data:application/pdf") ? (
                <div className="flex flex-col items-center py-8">
                  <FileText className="w-16 h-16 text-slate-800 mb-2" />
                  <span className="text-xs font-black uppercase text-slate-500">PDF Document Loaded</span>
                </div>
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="max-h-[180px] object-contain rounded-lg shadow-sm"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="absolute top-0 right-0 p-1.5 bg-slate-900 text-white rounded-full shadow-xl hover:bg-red-600 transition-colors"
                id={`clear-${label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-100 mb-4 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kéo thả hoặc nhấp chọn</p>
              <p className="text-[8px] mt-1 font-bold">MAX 10MB (JPG, PNG, PDF)</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
