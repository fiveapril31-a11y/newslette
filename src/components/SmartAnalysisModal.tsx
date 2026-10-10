import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  IndianRupee,
  BookOpen,
  Filter,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Search,
  Tag,
  ArrowUpDown,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { EmailItem } from '../types';
import {
  analyzeAndSeparateEmails,
  generateBrandQueriesCsv,
  generateNewslettersCsv,
  downloadCsvFile,
  KNOWN_SERVICES,
} from '../services/emailAnalyzer';

interface SmartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: EmailItem[];
  onSelectEmail?: (id: string) => void;
}

export const SmartAnalysisModal: React.FC<SmartAnalysisModalProps> = ({
  isOpen,
  onClose,
  emails,
  onSelectEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'brand_queries' | 'newsletters'>('brand_queries');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [budgetTierFilter, setBudgetTierFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'budget_desc' | 'budget_asc' | 'date_desc'>('budget_desc');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Run the smart separator algorithm
  const analysis = useMemo(() => {
    return analyzeAndSeparateEmails(emails);
  }, [emails]);

  // Filtered & Sorted Brand Queries
  const filteredBrandQueries = useMemo(() => {
    return analysis.brandQueries
      .filter((item) => {
        const meta = item.brandMeta;
        const service = meta?.serviceOpted || 'Audio & Soundtrack Production';
        const num = meta?.budgetNumeric || 0;

        // Service filter
        if (serviceFilter !== 'all' && service !== serviceFilter) {
          return false;
        }

        // Budget tier filter
        if (budgetTierFilter === 'high' && num < 100000) return false;
        if (budgetTierFilter === 'mid' && (num < 50000 || num >= 100000)) return false;
        if (budgetTierFilter === 'entry' && (num === 0 || num >= 50000)) return false;
        if (budgetTierFilter === 'negotiable' && num > 0) return false;

        // Text search filter
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          const match =
            (meta?.brandName || '').toLowerCase().includes(q) ||
            item.senderName.toLowerCase().includes(q) ||
            item.subject.toLowerCase().includes(q) ||
            service.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'budget_desc') {
          return (b.brandMeta?.budgetNumeric || 0) - (a.brandMeta?.budgetNumeric || 0);
        }
        if (sortBy === 'budget_asc') {
          return (a.brandMeta?.budgetNumeric || 0) - (b.brandMeta?.budgetNumeric || 0);
        }
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      });
  }, [analysis.brandQueries, serviceFilter, budgetTierFilter, searchFilter, sortBy]);

  // Filtered Newsletters
  const filteredNewsletters = useMemo(() => {
    return analysis.newsletters.filter((item) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.senderName.toLowerCase().includes(q) ||
        (item.newsletterMeta?.publication || '').toLowerCase().includes(q)
      );
    });
  }, [analysis.newsletters, searchFilter]);

  if (!isOpen) return null;

  const handleDownloadBrandCsv = () => {
    const csv = generateBrandQueriesCsv(filteredBrandQueries);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(`Akaar_Brand_Queries_${dateStr}.csv`, csv);
    setDownloadSuccess('Brand Queries Excel/CSV exported successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadNewsletterCsv = () => {
    const csv = generateNewslettersCsv(filteredNewsletters);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(`Akaar_Newsletters_${dateStr}.csv`, csv);
    setDownloadSuccess('Newsletters Excel/CSV exported successfully!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const avgDealSize =
    analysis.brandQueries.length > 0
      ? Math.round(analysis.totalPipelineRupees / analysis.brandQueries.length)
      : 0;

  return (
    <div
      id="smart-analysis-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="smart-analysis-modal"
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Smart Mail Analyzer & CSV Export
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                  Auto-Separated
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Separated by commercial queries (money & services) and newsletter publications.
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

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{downloadSuccess}</span>
            </div>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="p-0.5 hover:bg-emerald-700 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pipeline & Category Metric Ribbon */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-b border-slate-200 shrink-0">
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
              <span>Total Pipeline</span>
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-emerald-900 mt-1">
              ₹{analysis.totalPipelineRupees.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Commercial queries value</div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
              <span>Brand Queries</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-indigo-900 mt-1">
              {analysis.brandQueries.length}
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">By Money & Services</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
              <span>Average Deal</span>
              <Tag className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-blue-900 mt-1">
              ₹{avgDealSize.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">Per client query</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
            <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
              <span>Newsletters</span>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-purple-900 mt-1">
              {analysis.newsletters.length}
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5">Digests & publications</div>
          </div>
        </div>

        {/* Tab Selection & Export Action Row */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Main Category Tabs */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('brand_queries')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'brand_queries'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Brand Queries ({analysis.brandQueries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('newsletters')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'newsletters'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Newsletters ({analysis.newsletters.length})</span>
            </button>
          </div>

          {/* Quick One-Click Download CSV Button */}
          <div>
            {activeTab === 'brand_queries' ? (
              <button
                onClick={handleDownloadBrandCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Brand Queries (.csv)</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadNewsletterCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Newsletters (.csv)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls (for Brand Queries: by Money and Service) */}
        {activeTab === 'brand_queries' && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2.5 text-xs shrink-0">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search brand, client, or keyword..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Service Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Services ({analysis.brandQueries.length})</option>
                {KNOWN_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s} {analysis.servicesBreakdown[s] ? `(${analysis.servicesBreakdown[s]})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Money / Budget Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Budget:</span>
              <select
                value={budgetTierFilter}
                onChange={(e) => setBudgetTierFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">All Budgets</option>
                <option value="high">High Value (₹1L+) ({analysis.budgetTiersCount.highValue})</option>
                <option value="mid">Mid Tier (₹50k - ₹1L) ({analysis.budgetTiersCount.midTier})</option>
                <option value="entry">Under ₹50k ({analysis.budgetTiersCount.entryTier})</option>
                <option value="negotiable">Budget on Request ({analysis.budgetTiersCount.negotiable})</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="budget_desc">Money (Highest First)</option>
                <option value="budget_asc">Money (Lowest First)</option>
                <option value="date_desc">Newest Date</option>
              </select>
            </div>
          </div>
        )}

        {/* Scrollable Data Table Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'brand_queries' ? (
            filteredBrandQueries.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <IndianRupee className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600">No brand queries match these filters</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the service or budget filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBrandQueries.map((item) => {
                  const meta = item.brandMeta;
                  const num = meta?.budgetNumeric || 0;
                  const dateStr = new Date(item.receivedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectEmail) onSelectEmail(item.id);
                        onClose();
                      }}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {meta?.brandName || item.senderName}
                          </span>
                          <span className="text-xs text-slate-400">({item.senderEmail})</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {meta?.serviceOpted || 'Audio & Soundtrack Production'}
                          </span>
                          {meta?.urgency === 'high' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Urgent
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-700 truncate">{item.subject}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.preview}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                        <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {meta?.budgetOffer || 'Budget on Request'}
                        </span>
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredNewsletters.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600">No newsletters found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNewsletters.map((item) => {
                  const meta = item.newsletterMeta;
                  const dateStr = new Date(item.receivedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectEmail) onSelectEmail(item.id);
                        onClose();
                      }}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {meta?.publication || item.senderName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                            {meta?.readTimeMinutes || 3} min read
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{item.subject}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.preview}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400">{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Showing{' '}
            <strong className="text-slate-800">
              {activeTab === 'brand_queries'
                ? `${filteredBrandQueries.length} of ${analysis.brandQueries.length} brand queries`
                : `${filteredNewsletters.length} of ${analysis.newsletters.length} newsletters`}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'brand_queries' ? (
              <button
                onClick={handleDownloadBrandCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Brand Queries CSV</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadNewsletterCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Newsletters CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
