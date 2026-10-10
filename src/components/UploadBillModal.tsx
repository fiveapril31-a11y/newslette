import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  IndianRupee,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Briefcase,
  Paperclip,
} from 'lucide-react';
import { uploadClientBillRecord } from '../services/firebaseSync';
import { KNOWN_SERVICES } from '../services/emailAnalyzer';
import { ClientBill } from '../types';

interface UploadBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillUploaded?: (bill: Partial<ClientBill>) => void;
  initialClientName?: string;
  initialAmount?: number;
  initialService?: string;
}

export const UploadBillModal: React.FC<UploadBillModalProps> = ({
  isOpen,
  onClose,
  onBillUploaded,
  initialClientName = '',
  initialAmount,
  initialService = 'Audio & Soundtrack Production',
}) => {
  const [clientName, setClientName] = useState<string>(initialClientName);
  const [clientEmail, setClientEmail] = useState<string>('');
  const [service, setService] = useState<string>(initialService);
  const [billAmount, setBillAmount] = useState<string>(initialAmount ? String(initialAmount) : '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<{
    name: string;
    size: string;
    data: string;
  } | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Check size limit: max 8MB
    if (selected.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds 8MB limit. Please upload a smaller bill/receipt.');
      return;
    }

    const sizeStr =
      selected.size > 1024 * 1024
        ? `${(selected.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(selected.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFile({
        name: selected.name,
        size: sizeStr,
        data: event.target?.result as string,
      });
      setUploadError(null);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setUploadError('Please specify the Client or Brand Name.');
      return;
    }

    const numericAmount = parseFloat(billAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setUploadError('Please enter a valid bill amount in Indian Rupees (₹).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const payload = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        service,
        billAmount: numericAmount,
        currency: 'INR',
        invoiceNumber: invoiceNumber.trim(),
        notes: notes.trim(),
        fileName: file?.name || 'Invoice.pdf',
        fileData: file?.data || '',
        fileSize: file?.size || 'Digital Record',
        uploadedBy: 'Akaar Team',
      };

      await uploadClientBillRecord(payload);

      if (onBillUploaded) {
        onBillUploaded(payload);
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload bill. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="upload-bill-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="upload-bill-modal"
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Client Bill & Data</h2>
              <p className="text-xs text-slate-500">
                Syncs commercial invoices and contracts across all team devices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bill successfully uploaded and shared to real-time team chat!</span>
            </div>
          )}

          {/* Client / Brand Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Client / Brand Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Client Studio, Brand Partner, Production House"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Service Opted For */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Service Opted For <span className="text-rose-500">*</span>
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              {KNOWN_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Bill Amount & Invoice # Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bill Amount (INR ₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="text-slate-500 font-bold absolute left-3 top-1/2 -translate-y-1/2">
                  ₹
                </span>
                <input
                  type="text"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice / Bill Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-088"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Client Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Client Contact Email (Optional)
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g. accounts@clientbrand.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Notes / Terms */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notes & Deliverables
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Milestone payments, 50% advance received, audio master stems delivered..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* File Upload Drag & Drop Area */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Bill / Invoice File (PDF, Image, Receipt)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
            />

            {file ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-emerald-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-emerald-700">{file.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 text-emerald-700 hover:text-emerald-900 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 transition cursor-pointer text-center space-y-1.5"
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Click or drag file here to upload</p>
                <p className="text-[11px] text-slate-400">PDF, JPG, PNG up to 8MB</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading & Syncing...' : 'Save & Sync Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
