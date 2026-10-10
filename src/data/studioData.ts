import { EmailItem, FolderItem, SmartTag, CustomFilterRule } from '../types';

export const USER_EMAIL = 'service@akaarentertainment.com';
export const USER_DISPLAY_NAME = 'Akaar Entertainment (service@akaarentertainment.com)';
export const SECONDARY_USER_EMAIL = 'support@akaar.com';

export const INITIAL_FOLDERS: FolderItem[] = [
  { id: 'inbox', name: 'Primary Inbox', iconName: 'Inbox', color: '#3b82f6', isSystem: true },
  { id: 'sent', name: 'Sent Messages', iconName: 'Send', color: '#8b5cf6', isSystem: true },
  { id: 'brand_deals', name: 'Customer Queries & Deals', iconName: 'Briefcase', color: '#10b981', categoryFilter: 'brand_query' },
  { id: 'website_leads', name: 'Website Inquiries', iconName: 'Globe', color: '#06b6d4', categoryFilter: 'brand_query' },
  { id: 'newsletters', name: 'Newsletters & Digests', iconName: 'BookOpen', color: '#6366f1', categoryFilter: 'newsletter' },
  { id: 'personal_vault', name: 'Personal Correspondence', iconName: 'UserCheck', color: '#64748b', categoryFilter: 'personal' },
  { id: 'archive', name: 'Archived', iconName: 'Archive', color: '#94a3b8', isSystem: true },
  { id: 'trash', name: 'Trash', iconName: 'Trash2', color: '#ef4444', isSystem: true },
];

export const INITIAL_SMART_TAGS: SmartTag[] = [
  { id: 'tag-high-value', name: 'High Value (₹50k+)', color: '#059669', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', borderClass: 'border-emerald-200', categoryDefault: 'brand_query' },
  { id: 'tag-sponsorship', name: 'Sponsorship Pitch', color: '#0d9488', bgClass: 'bg-teal-50', textClass: 'text-teal-700', borderClass: 'border-teal-200', categoryDefault: 'brand_query' },
  { id: 'tag-licensing', name: 'Licensing & Sync', color: '#7c3aed', bgClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-purple-200', categoryDefault: 'brand_query' },
  { id: 'tag-urgent', name: 'Urgent Query', color: '#e11d48', bgClass: 'bg-rose-50', textClass: 'text-rose-700', borderClass: 'border-rose-200' },
  { id: 'tag-creator-digest', name: 'Creator Digest', color: '#2563eb', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-blue-200', categoryDefault: 'newsletter' },
  { id: 'tag-tech-trends', name: 'Industry Intel', color: '#4f46e5', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700', borderClass: 'border-indigo-200', categoryDefault: 'newsletter' },
  { id: 'tag-personal-note', name: 'Personal / Family', color: '#475569', bgClass: 'bg-slate-100', textClass: 'text-slate-700', borderClass: 'border-slate-200', categoryDefault: 'personal' },
];

export const INITIAL_CUSTOM_FILTERS: CustomFilterRule[] = [
  {
    id: 'rule-1',
    name: 'Auto-Triage Substack & Newsletters',
    field: 'sender',
    operator: 'contains',
    value: 'substack.com',
    action: 'move_to_folder',
    actionTarget: 'newsletters',
    isActive: true,
    matchesCount: 0,
  },
  {
    id: 'rule-2',
    name: 'Separate Personal Mail',
    field: 'type',
    operator: 'equals',
    value: 'personal',
    action: 'isolate_personal',
    actionTarget: 'personal_vault',
    isActive: true,
    matchesCount: 0,
  },
  {
    id: 'rule-3',
    name: 'High Value Brand Alert (₹50k+)',
    field: 'budget',
    operator: 'greater_than',
    value: '50000',
    action: 'assign_tag',
    actionTarget: 'High Value (₹50k+)',
    isActive: true,
    matchesCount: 0,
  },
  {
    id: 'rule-4',
    name: 'Website Form Sync Inquiries',
    field: 'subject',
    operator: 'contains',
    value: 'Website Contact Form',
    action: 'move_to_folder',
    actionTarget: 'website_leads',
    isActive: true,
    matchesCount: 0,
  },
];

// Clean initial emails state: only genuine received emails and manually added deals are displayed
export const INITIAL_EMAILS: EmailItem[] = [];
