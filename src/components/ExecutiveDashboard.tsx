import { useState, useMemo, type FormEvent } from 'react';
import {
  Briefcase,
  TrendingUp,
  Mail,
  IndianRupee,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Send,
  Plus,
  FileSpreadsheet,
  Upload,
  Globe,
  Sliders,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  RotateCcw,
  Undo2
} from 'lucide-react';
import { EmailItem } from '../types';

interface ExecutiveDashboardProps {
  emails: EmailItem[];
  onSelectEmail: (email: EmailItem) => void;
  onOpenMailbox: () => void;
  onOpenInboundGateway: () => void;
  onOpenSmartAnalysis: () => void;
  onOpenUploadBill: () => void;
  onOpenRealtimeChat: () => void;
  onOpenPublicPortal: () => void;
  onUpdateEmailStage: (emailId: string, newStage: 'New Lead' | 'In Discussion' | 'Confirmed' | 'Completed') => void;
  onAddNewDeal: (dealData: {
    clientName: string;
    clientEmail: string;
    brandName: string;
    budget: number;
    service: string;
    subject: string;
    deliverables: string;
  }) => void;
  userEmail: string;
  brandOffersTotal: number;
  onResetAllToZero?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
}

export default function ExecutiveDashboard({
  emails,
  onSelectEmail,
  onOpenMailbox,
  onOpenInboundGateway,
  onOpenSmartAnalysis,
  onOpenUploadBill,
  onOpenRealtimeChat,
  onOpenPublicPortal,
  onUpdateEmailStage,
  onAddNewDeal,
  userEmail,
  brandOffersTotal,
  onResetAllToZero,
  onUndo,
  canUndo,
  undoCount,
}: ExecutiveDashboardProps) {
  // Rate & Proposal Calculator State - defaults to null / ₹0 for clean 1st time state
  const [calcService, setCalcService] = useState<'audio_series' | 'film_score' | 'brand_integration' | 'podcast_production' | 'licensing' | null>(null);
  const [calcTier, setCalcTier] = useState<'standard' | 'flagship' | 'enterprise'>('flagship');
  const [calcEpisodes, setCalcEpisodes] = useState<number>(1);
  const [calcExclusivity, setCalcExclusivity] = useState<'non_exclusive' | 'quarterly' | 'perpetual'>('non_exclusive');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [customContactEmail, setCustomContactEmail] = useState<string>('');
  const [proposalCopied, setProposalCopied] = useState<boolean>(false);
  const [proposalSentSuccess, setProposalSentSuccess] = useState<boolean>(false);

  // New Deal Modal State
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState<boolean>(false);
  const [newDealClient, setNewDealClient] = useState('');
  const [newDealEmail, setNewDealEmail] = useState('');
  const [newDealService, setNewDealService] = useState('Commercial Audio Sync');
  const [newDealBudget, setNewDealBudget] = useState('');
  const [newDealDeliverables, setNewDealDeliverables] = useState('');

  // Stage Filter for Pipeline Table
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'New Lead' | 'In Discussion' | 'Confirmed' | 'Completed'>('all');

  // Filter brand query emails
  const brandEmails = useMemo(() => {
    return emails.filter((e) => e.category === 'brand_query');
  }, [emails]);

  // Aggregate deal pipeline statistics
  const pipelineMetrics = useMemo(() => {
    let totalPipeline = 0;
    let confirmedWon = 0;
    let inDiscussion = 0;
    let newLeadsCount = 0;

    brandEmails.forEach((email) => {
      const budget = email.brandMeta?.budgetNumeric || 
        (email.brandMeta?.budgetOffer ? parseInt(email.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10) || 0 : 0);
      
      totalPipeline += budget;

      const status = email.brandMeta?.status || 'New Lead';
      if (status === 'Confirmed' || status === 'Completed') {
        confirmedWon += budget;
      } else if (status === 'In Discussion') {
        inDiscussion += budget;
      } else {
        newLeadsCount++;
      }
    });

    const winRate = brandEmails.length > 0 
      ? Math.round(((brandEmails.filter(e => e.brandMeta?.status === 'Confirmed' || e.brandMeta?.status === 'Completed').length) / brandEmails.length) * 100) 
      : 0;

    return {
      totalPipeline,
      confirmedWon,
      inDiscussion,
      newLeadsCount,
      activeDealsCount: brandEmails.length,
      winRate
    };
  }, [brandEmails]);

  // Dynamic Revenue Distribution based on active brand deals
  const revenueDistribution = useMemo(() => {
    const serviceTotals: Record<string, number> = {
      'Original Audio Series & Podcasts': 0,
      'Commercial Film Score & Soundtrack Sync': 0,
      'Creator Studio Brand Integrations': 0,
      'Catalog Music & Voice Licensing': 0,
    };

    let totalGross = 0;

    brandEmails.forEach((email) => {
      const budget = email.brandMeta?.budgetNumeric || 
        (email.brandMeta?.budgetOffer ? parseInt(email.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10) || 0 : 0);
      
      const service = (email.brandMeta?.serviceOpted || email.subject || '').toLowerCase();
      totalGross += budget;

      if (service.includes('film') || service.includes('score')) {
        serviceTotals['Commercial Film Score & Soundtrack Sync'] += budget;
      } else if (service.includes('integration') || service.includes('sponsor')) {
        serviceTotals['Creator Studio Brand Integrations'] += budget;
      } else if (service.includes('licens') || service.includes('catalog')) {
        serviceTotals['Catalog Music & Voice Licensing'] += budget;
      } else {
        serviceTotals['Original Audio Series & Podcasts'] += budget;
      }
    });

    const items = Object.entries(serviceTotals).map(([name, val], idx) => {
      const pct = totalGross > 0 ? Math.round((val / totalGross) * 100) : 0;
      const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-teal-600', 'bg-purple-600'];
      return {
        name,
        value: `₹${val.toLocaleString('en-IN')}`,
        raw: val,
        pct,
        barColor: colors[idx % colors.length],
      };
    });

    return { totalGross, items };
  }, [brandEmails]);

  // Calculate live instant quote based on selections - 0 when clean state
  const computedQuote = useMemo(() => {
    if (!calcService) {
      return {
        total: 0,
        productionFee: 0,
        rightsFee: 0,
        masteringFee: 0
      };
    }

    let base = 150000;
    if (calcService === 'audio_series') base = 350000;
    if (calcService === 'film_score') base = 500000;
    if (calcService === 'brand_integration') base = 250000;
    if (calcService === 'podcast_production') base = 180000;
    if (calcService === 'licensing') base = 120000;

    const tierMultiplier = calcTier === 'standard' ? 1 : calcTier === 'flagship' ? 1.45 : 2.1;
    const episodesMultiplier = 1 + (calcEpisodes - 1) * 0.65;
    const exclusivityCost = calcExclusivity === 'non_exclusive' ? 0 : calcExclusivity === 'quarterly' ? 65000 : 180000;

    const total = Math.round((base * tierMultiplier * episodesMultiplier) + exclusivityCost);
    const productionFee = Math.round(total * 0.70);
    const rightsFee = Math.round(total * 0.20);
    const masteringFee = total - productionFee - rightsFee;

    return {
      total,
      productionFee,
      rightsFee,
      masteringFee
    };
  }, [calcService, calcTier, calcEpisodes, calcExclusivity]);

  const handleResetQuoteToZero = () => {
    setCalcService(null);
    setCalcEpisodes(1);
    setCalcExclusivity('non_exclusive');
    setCustomClientName('');
    setCustomContactEmail('');
  };

  // Handle Copying Proposal Draft
  const handleCopyProposal = () => {
    if (!calcService) return;

    const serviceNameMap: Record<string, string> = {
      audio_series: 'Original Audio Series Production',
      film_score: 'Commercial Film Score & Soundtrack Sync',
      brand_integration: 'Creator Studio Brand Integration',
      podcast_production: 'Flagship Podcast Co-Production',
      licensing: 'Catalog Music & Voice Master Licensing'
    };

    const targetClient = customClientName.trim() || 'Prospective Brand Partner';
    const targetEmail = customContactEmail.trim() || 'contact@clientbrand.com';

    const text = `PROPOSAL & COMMERCIAL TERMS | AKAAR ENTERTAINMENT
Client: ${targetClient} (${targetEmail})
Service: ${serviceNameMap[calcService] || calcService}
Tier: ${calcTier.toUpperCase()} (${calcEpisodes} Deliverables)
Commercial Terms: ₹${computedQuote.total.toLocaleString('en-IN')} (Rupees)

Scope Breakdown:
- Production & Studio Engineering: ₹${computedQuote.productionFee.toLocaleString('en-IN')}
- Commercial Broadcast & Streaming Rights: ₹${computedQuote.rightsFee.toLocaleString('en-IN')}
- Dolby Atmos Mastering & Delivery: ₹${computedQuote.masteringFee.toLocaleString('en-IN')}
- Exclusivity: ${calcExclusivity === 'quarterly' ? 'Quarterly Category Exclusivity' : calcExclusivity === 'perpetual' ? 'Perpetual Broadcast Exclusivity' : 'Non-Exclusive Sync'}

Invoicing Contact: service@akaarentertainment.com
Website: akaarentertainment.com`;

    navigator.clipboard.writeText(text);
    setProposalCopied(true);
    setTimeout(() => setProposalCopied(false), 2500);
  };

  const handleSendProposalDeal = () => {
    const targetClient = customClientName.trim() || 'Client Proposal';
    const targetEmail = customContactEmail.trim() || 'inquiry@clientbrand.com';

    onAddNewDeal({
      clientName: targetClient,
      clientEmail: targetEmail,
      brandName: targetClient,
      budget: computedQuote.total,
      service: calcService.replace('_', ' ').toUpperCase(),
      subject: `Commercial Proposal: ${targetClient} - Akaar Entertainment Production`,
      deliverables: `${calcEpisodes}x ${calcTier} Package Deliverables`
    });
    setProposalSentSuccess(true);
    setTimeout(() => setProposalSentSuccess(false), 3000);
  };

  const handleCreateDealSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newDealClient.trim()) return;

    const parsedBudget = parseInt(newDealBudget.replace(/[^0-9]/g, ''), 10) || 100000;

    onAddNewDeal({
      clientName: newDealClient.trim(),
      clientEmail: newDealEmail.trim() || `team@${newDealClient.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      brandName: newDealClient.trim(),
      budget: parsedBudget,
      service: newDealService,
      subject: `New Production Inquiry: ${newDealClient.trim()} - ${newDealService}`,
      deliverables: newDealDeliverables.trim() || 'Full Studio Audio Deliverables & Master Rights'
    });

    setIsAddDealModalOpen(false);
    setNewDealClient('');
    setNewDealEmail('');
    setNewDealBudget('');
    setNewDealDeliverables('');
  };

  // Pipeline stages definition
  const pipelineStages: Array<'New Lead' | 'In Discussion' | 'Confirmed' | 'Completed'> = [
    'New Lead',
    'In Discussion',
    'Confirmed',
    'Completed'
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 pb-12">
      {/* Top Banner / Ingestion Health Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Akaar Entertainment Executive Portal
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Production & Revenue Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              Deal Pipeline & Client Inbound Command Center
            </h1>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddDealModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Client Deal</span>
            </button>

            <button
              onClick={onOpenInboundGateway}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inbound Gateway</span>
            </button>

            <button
              onClick={onOpenSmartAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Ledger</span>
            </button>

            <button
              onClick={onOpenPublicPortal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-600" />
              <span>Public Portal</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Real-time Inbound Ingestion Status Banner */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">Inbound Mail Channels:</span>
                <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  service@akaarentertainment.com
                </span>
                <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  support@akaar.com
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time receiver active · Free Cloudflare & Webhook ingestion ready · Ingested queries appear immediately in inbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={onOpenInboundGateway}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
            >
              <span>Verify Mail Routing Setup</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Core Financial & Pipeline Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pipeline Value */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Total Deal Pipeline</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              ₹{pipelineMetrics.totalPipeline.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +28.4%
              </span>
              <span>· {pipelineMetrics.activeDealsCount} active brand opportunities</span>
            </div>
          </div>

          {/* Card 2: Confirmed & Won Deals */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Won & Invoiced Revenue</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              ₹{pipelineMetrics.confirmedWon.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <span className="text-emerald-600 font-semibold">
                {pipelineMetrics.winRate}% win rate
              </span>
              <span>· Locked studio contracts</span>
            </div>
          </div>

          {/* Card 3: Active Negotiations */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Active Negotiations</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              ₹{pipelineMetrics.inDiscussion.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <span className="text-amber-700 font-medium">Rate card dispatched</span>
              <span>· Awaiting sign-off</span>
            </div>
          </div>

          {/* Card 4: Average Client Turnaround */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Studio Ingestion Health</span>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              18 mins
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <span className="text-teal-700 font-medium">Avg. response latency</span>
              <span>· 100% SLA adherence</span>
            </div>
          </div>
        </div>

        {/* Section 2: Interactive Deal Pipeline Board (Kanban / Funnel View) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Commercial Pipeline & Deal Funnel</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag, click, or progress client brand deals through contracting stages in real-time
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setPipelineFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition ${pipelineFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All Deals ({brandEmails.length})
                </button>
                <button
                  onClick={() => setPipelineFilter('New Lead')}
                  className={`px-2.5 py-1 rounded-md transition ${pipelineFilter === 'New Lead' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  New Leads
                </button>
                <button
                  onClick={() => setPipelineFilter('In Discussion')}
                  className={`px-2.5 py-1 rounded-md transition ${pipelineFilter === 'In Discussion' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Negotiating
                </button>
                <button
                  onClick={() => setPipelineFilter('Confirmed')}
                  className={`px-2.5 py-1 rounded-md transition ${pipelineFilter === 'Confirmed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Won
                </button>
              </div>

              <button
                onClick={onOpenMailbox}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>Open Mailbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineStages.map((stage) => {
              const stageEmails = brandEmails.filter((e) => {
                const itemStatus = e.brandMeta?.status || 'New Lead';
                if (pipelineFilter !== 'all' && pipelineFilter !== stage) return false;
                return itemStatus === stage;
              });

              const stageTotal = stageEmails.reduce((acc, curr) => {
                const val = curr.brandMeta?.budgetNumeric || 
                  (curr.brandMeta?.budgetOffer ? parseInt(curr.brandMeta.budgetOffer.replace(/[^0-9]/g, ''), 10) || 0 : 0);
                return acc + val;
              }, 0);

              const stageBadgeColor: Record<string, string> = {
                'New Lead': 'bg-blue-50 text-blue-700 border-blue-200',
                'In Discussion': 'bg-amber-50 text-amber-700 border-amber-200',
                'Confirmed': 'bg-purple-50 text-purple-700 border-purple-200',
                'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
              };

              return (
                <div key={stage} className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[380px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{stage}</span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {stageEmails.length}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-700">
                      ₹{stageTotal.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Stage Cards */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {stageEmails.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No deals in this stage
                      </div>
                    ) : (
                      stageEmails.map((deal) => {
                        const budget = deal.brandMeta?.budgetOffer || '₹2,50,000';
                        const brand = deal.brandMeta?.brandName || deal.senderName;
                        const service = deal.brandMeta?.serviceOpted || 'Commercial Audio Sync';

                        return (
                          <div
                            key={deal.id}
                            onClick={() => {
                              onSelectEmail(deal);
                              onOpenMailbox();
                            }}
                            className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-xs hover:border-indigo-400 transition cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <span className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                                {brand}
                              </span>
                              <span className="text-xs font-bold text-emerald-700 font-mono shrink-0">
                                {budget}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                              {deal.subject}
                            </p>

                            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="truncate max-w-[140px] text-indigo-700 font-medium">
                                {service}
                              </span>
                              <span className="text-slate-400">
                                {new Date(deal.receivedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Quick Stage Mover Controls */}
                            <div 
                              className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-slate-400 font-medium">Move:</span>
                              <div className="flex items-center gap-1">
                                {stage !== 'New Lead' && (
                                  <button
                                    onClick={() => onUpdateEmailStage(deal.id, 'New Lead')}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    title="Move to New Lead"
                                  >
                                    Lead
                                  </button>
                                )}
                                {stage !== 'In Discussion' && (
                                  <button
                                    onClick={() => onUpdateEmailStage(deal.id, 'In Discussion')}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                                    title="Move to In Discussion"
                                  >
                                    Discuss
                                  </button>
                                )}
                                {stage !== 'Confirmed' && (
                                  <button
                                    onClick={() => onUpdateEmailStage(deal.id, 'Confirmed')}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                                    title="Move to Confirmed"
                                  >
                                    Lock
                                  </button>
                                )}
                                {stage !== 'Completed' && (
                                  <button
                                    onClick={() => onUpdateEmailStage(deal.id, 'Completed')}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    title="Move to Completed"
                                  >
                                    Won
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Interactive Instant Rate & Proposal Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Interactive Quote Builder */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Interactive Commercial Rate & Quote Builder
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure deliverables, campaign scale & exclusivity to generate instant INR quotes
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                FY 2026 Rate Matrix
              </span>
            </div>

            <div className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Entertainment Production Service
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'audio_series', label: 'Audio Series Production', base: '₹3.5L' },
                    { id: 'film_score', label: 'Film Soundtrack & Sync', base: '₹5.0L' },
                    { id: 'brand_integration', label: 'Creator Brand Integration', base: '₹2.5L' },
                    { id: 'podcast_production', label: 'Podcast Co-Production', base: '₹1.8L' },
                    { id: 'licensing', label: 'Catalog Sync License', base: '₹1.2L' },
                  ].map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setCalcService(srv.id as any)}
                      className={`p-2.5 rounded-lg text-left border text-xs transition cursor-pointer ${
                        calcService === srv.id
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold line-clamp-1">{srv.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">Base: {srv.base}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Tier & Deliverables Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Production Tier & Quality Spec
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'standard', label: 'Standard Digital', mult: '1.0x' },
                      { id: 'flagship', label: 'Flagship Studio', mult: '1.45x' },
                      { id: 'enterprise', label: 'Broadcast Dolby', mult: '2.1x' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setCalcTier(tier.id as any)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                          calcTier === tier.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Deliverables Count: <strong className="text-indigo-600">{calcEpisodes} Items</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={calcEpisodes}
                    onChange={(e) => setCalcEpisodes(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 Unit</span>
                    <span>2 Units</span>
                    <span>4 Units</span>
                    <span>6 Units</span>
                  </div>
                </div>
              </div>

              {/* Exclusivity Rights */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Licensing Rights & Exclusivity Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'non_exclusive', label: 'Non-Exclusive', desc: 'Standard digital rights' },
                    { id: 'quarterly', label: '90-Day Category Hold', desc: '+₹65,000 exclusivity' },
                    { id: 'perpetual', label: 'Perpetual Broadcast', desc: '+₹1,80,000 buyout' },
                  ].map((exc) => (
                    <button
                      key={exc.id}
                      type="button"
                      onClick={() => setCalcExclusivity(exc.id as any)}
                      className={`p-2 rounded-lg text-xs text-left border transition cursor-pointer ${
                        calcExclusivity === exc.id
                          ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-semibold">{exc.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{exc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Calculated Proposal & Instant Dispatch */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                  Commercial Valuation
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ready for Invoicing
                </span>
              </div>

              <div className="my-2">
                <span className="text-xs text-slate-400">Total Calculated Rate:</span>
                <div className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                  ₹{computedQuote.total.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Includes master stems, sync certificate & multi-platform rollout
                </p>
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="space-y-1.5 py-3 border-t border-b border-white/10 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Studio & Production Execution:</span>
                  <span className="font-mono text-white">₹{computedQuote.productionFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Broadcast & Commercial Rights:</span>
                  <span className="font-mono text-white">₹{computedQuote.rightsFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Dolby Atmos Mastering:</span>
                  <span className="font-mono text-white">₹{computedQuote.masteringFee.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Client Proposal Inputs */}
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Client Name</label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Contact Email</label>
                    <input
                      type="email"
                      value={customContactEmail}
                      onChange={(e) => setCustomContactEmail(e.target.value)}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Action Buttons */}
            <div className="pt-4 mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyProposal}
                className="flex-1 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {proposalCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Proposal!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy Proposal Card</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendProposalDeal}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {proposalSentSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added to Deals!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log to Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Entertainment Revenue Breakdown & Inbound Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 6 Cols: Revenue by Service Breakdown */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revenue & Service Distribution</h3>
                <p className="text-xs text-slate-500">Commercial allocation across studio business units</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ₹{revenueDistribution.totalGross.toLocaleString('en-IN')} Gross
              </span>
            </div>

            {revenueDistribution.totalGross === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="text-xs font-semibold text-slate-700">No client deals logged yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Deals received from clients or added via "Log Client Deal" will calculate commercial distribution automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {revenueDistribution.items.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-mono font-bold text-slate-900">{item.value} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <span>Looking for complete financial ledgers with client bill uploads?</span>
              <button
                onClick={onOpenUploadBill}
                className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Upload Client Bill</span>
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right 6 Cols: Recent Client Correspondence & Quick Action Feed */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Inbound Client Inquiries</h3>
                <p className="text-xs text-slate-500">Live feed arriving at service@akaarentertainment.com</p>
              </div>

              <button
                onClick={onOpenMailbox}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full Mailbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
              {brandEmails.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold text-slate-700">No client inquiries received yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Incoming emails arriving at service@akaarentertainment.com or deals logged manually will appear here in real-time.
                  </p>
                </div>
              ) : (
                brandEmails.slice(0, 4).map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      onSelectEmail(email);
                      onOpenMailbox();
                    }}
                    className="p-3 rounded-lg border border-slate-200/80 hover:border-indigo-400 hover:bg-slate-50/50 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {email.senderName}
                        </span>
                        {email.brandMeta?.urgency === 'high' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{email.subject}</p>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{email.senderEmail}</span>
                        <span>·</span>
                        <span>{new Date(email.receivedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-emerald-700">
                        {email.brandMeta?.budgetOffer || '₹2,50,000'}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold block mt-1">
                        View Deal →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Inbound receiver synchronized
              </span>
              <button
                onClick={onOpenRealtimeChat}
                className="font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Team Studio Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Log New Client Deal */}
      {isAddDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Log Commercial Client Deal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a client inquiry to the studio pipeline under service@akaarentertainment.com
            </p>

            <form onSubmit={handleCreateDealSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Brand Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Bull Records, Netflix India"
                  value={newDealClient}
                  onChange={(e) => setNewDealClient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. partnerships@redbull.com"
                  value={newDealEmail}
                  onChange={(e) => setNewDealEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Scope
                  </label>
                  <select
                    value={newDealService}
                    onChange={(e) => setNewDealService(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Commercial Audio Sync">Commercial Audio Sync</option>
                    <option value="Original Audio Series">Original Audio Series</option>
                    <option value="Film Score & Sound Design">Film Score & Sound Design</option>
                    <option value="Creator Brand Integration">Creator Brand Integration</option>
                    <option value="Podcast Sponsorship">Podcast Sponsorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={newDealBudget}
                    onChange={(e) => setNewDealBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverables Summary
                </label>
                <input
                  type="text"
                  value={newDealDeliverables}
                  onChange={(e) => setNewDealDeliverables(e.target.value)}
                  placeholder="e.g. 2x 90s integrated cues, Dolby stems"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDealModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
