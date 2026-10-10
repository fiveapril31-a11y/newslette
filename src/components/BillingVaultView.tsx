import { useState, useEffect, type FormEvent } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  ExternalLink,
  Building,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import { ClientBill } from '../types';
import { subscribeToClientBills, uploadClientBillRecord } from '../services/firebaseSync';

interface BillingVaultViewProps {
  onOpenUploadModal: () => void;
  onOpenSmartAnalysis: () => void;
  onOpenMailbox: () => void;
}

interface VaultInvoiceRecord {
  id: string;
  invoiceNo: string;
  clientName: string;
  clientEmail: string;
  service: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod: string;
}

export default function BillingVaultView({
  onOpenUploadModal,
  onOpenSmartAnalysis,
  onOpenMailbox,
}: BillingVaultViewProps) {
  // Live synced bills
  const [bills, setBills] = useState<VaultInvoiceRecord[]>(() => {
    try {
      const cached = localStorage.getItem('akaar_client_bills_vault');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  // Quick manual invoice creation modal
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
  const [manualClient, setManualClient] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualService, setManualService] = useState('Commercial Audio Sync & Scoring');
  const [manualAmount, setManualAmount] = useState('');
  const [manualStatus, setManualStatus] = useState<'Pending' | 'Paid'>('Pending');

  // Subscribe to real-time bills from Firestore / local sync
  useEffect(() => {
    const unsubscribe = subscribeToClientBills((remoteBills: ClientBill[]) => {
      if (remoteBills && remoteBills.length > 0) {
        setBills((prev) => {
          const map = new Map<string, VaultInvoiceRecord>();
          prev.forEach((b) => map.set(b.id, b));

          remoteBills.forEach((rb) => {
            if (!map.has(rb.id)) {
              map.set(rb.id, {
                id: rb.id,
                invoiceNo: rb.invoiceNumber || `AE-${rb.id.slice(0, 6).toUpperCase()}`,
                clientName: rb.clientName,
                clientEmail: rb.clientEmail || `contact@${rb.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                service: rb.service,
                amount: rb.billAmount,
                issueDate: rb.createdAt ? rb.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                status: 'Paid',
                paymentMethod: 'Bank Wire / RTGS',
              });
            }
          });

          const merged = Array.from(map.values());
          localStorage.setItem('akaar_client_bills_vault', JSON.stringify(merged));
          return merged;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreateManualInvoice = (e: FormEvent) => {
    e.preventDefault();
    if (!manualClient.trim() || !manualAmount.trim()) return;

    const numAmount = parseInt(manualAmount.replace(/[^0-9]/g, ''), 10) || 0;
    const invNo = `AE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: VaultInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo: invNo,
      clientName: manualClient.trim(),
      clientEmail: manualEmail.trim() || `accounts@${manualClient.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      service: manualService,
      amount: numAmount,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      status: manualStatus,
      paymentMethod: manualStatus === 'Paid' ? 'RTGS / Bank Transfer' : 'Direct Invoicing',
    };

    setBills((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('akaar_client_bills_vault', JSON.stringify(updated));
      return updated;
    });

    // Also sync to Firestore
    uploadClientBillRecord({
      clientName: manualClient.trim(),
      clientEmail: manualEmail.trim(),
      service: manualService,
      billAmount: numAmount,
      currency: 'INR',
      invoiceNumber: invNo,
      uploadedBy: 'Studio Finance Manager',
    }).catch(console.warn);

    setIsManualInvoiceModalOpen(false);
    setManualClient('');
    setManualEmail('');
    setManualAmount('');
  };

  const filteredBills = bills.filter((b) => {
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.clientName.toLowerCase().includes(q) ||
        b.invoiceNo.toLowerCase().includes(q) ||
        b.service.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totals = {
    totalInvoiced: bills.reduce((acc, curr) => acc + curr.amount, 0),
    totalCollected: bills.filter((b) => b.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0),
    totalPending: bills.filter((b) => b.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0),
  };

  const handleDownloadInvoice = (bill: VaultInvoiceRecord) => {
    const csvContent = `data:text/csv;charset=utf-8,Invoice Number,Client,Email,Service,Amount (INR),Issue Date,Due Date,Status\n"${bill.invoiceNo}","${bill.clientName}","${bill.clientEmail}","${bill.service}","${bill.amount}","${bill.issueDate}","${bill.dueDate}","${bill.status}"`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${bill.invoiceNo}_Invoice_Akaar_Entertainment.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccessId(bill.id);
    setTimeout(() => setDownloadSuccessId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 pb-12">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Akaar Entertainment Finance Vault
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Commercial Invoicing & Accounts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              Client Accounts & Invoicing Center
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualInvoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Client Invoice</span>
            </button>

            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Bill / Receipt</span>
            </button>

            <button
              onClick={onOpenSmartAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full CSV Analysis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">Total Invoiced</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              ₹{totals.totalInvoiced.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {bills.length} {bills.length === 1 ? 'client invoice recorded' : 'client invoices recorded'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">Collected Revenue</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              ₹{totals.totalCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Verified settlement receipts</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">Pending Invoices</div>
            <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              ₹{totals.totalPending.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1">In progress client disbursements</p>
          </div>
        </div>

        {/* Filter and Invoices Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, invoice #, service..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client Organization</th>
                  <th className="py-3 px-4">Scope & Service</th>
                  <th className="py-3 px-4 text-right">Amount (₹ INR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No client billing records found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Invoices uploaded via "Upload Bill" or recorded manually will appear here in your client accounts vault.
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setIsManualInvoiceModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record Client Invoice</span>
                        </button>
                        <button
                          onClick={onOpenUploadModal}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Bill PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                        {bill.invoiceNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{bill.clientName}</div>
                        <div className="text-[11px] text-slate-500">{bill.clientEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {bill.service}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ₹{bill.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            bill.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : bill.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {bill.dueDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(bill)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition cursor-pointer"
                          title="Download Invoice CSV"
                        >
                          {downloadSuccessId === bill.id ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Downloaded</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Invoice Recording Modal */}
      {isManualInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Client Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a commercial deal invoice to the finance vault.
            </p>

            <form onSubmit={handleCreateManualInvoice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualClient}
                  onChange={(e) => setManualClient(e.target.value)}
                  placeholder="e.g. Client Organization or Studio Partner"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="e.g. billing@clientbrand.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope of Service
                </label>
                <select
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="Commercial Audio Sync & Scoring">Commercial Audio Sync & Scoring</option>
                  <option value="Flagship Podcast Audio Engineering">Flagship Podcast Audio Engineering</option>
                  <option value="Brand Integration & Creator Sponsorship">Brand Integration & Creator Sponsorship</option>
                  <option value="Dolby Atmos Mixing & Mastering">Dolby Atmos Mixing & Mastering</option>
                  <option value="Original Soundtrack Licensing Buyout">Original Soundtrack Licensing Buyout</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Settlement Status
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualInvoiceModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
