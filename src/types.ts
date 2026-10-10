export type EmailCategory = 'brand_query' | 'newsletter' | 'personal';

export interface BrandMetadata {
  brandName: string;
  budgetOffer?: string;
  budgetNumeric?: number;
  serviceOpted?: string;
  campaignType?: string;
  websiteUrl?: string;
  deadline?: string;
  contactPerson?: string;
  clientEmail?: string;
  urgency?: 'high' | 'medium' | 'low';
  status?: 'New Lead' | 'In Discussion' | 'Confirmed' | 'Completed';
  deliverables?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderEmail?: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  device?: string;
  hasBill?: boolean;
  billData?: {
    clientName: string;
    billAmount: number;
    currency: string;
    invoiceNumber: string;
    service?: string;
    fileName?: string;
    fileUrl?: string;
    notes?: string;
  };
}

export interface ClientBill {
  id: string;
  clientName: string;
  clientEmail?: string;
  service: string;
  billAmount: number;
  currency: string;
  invoiceNumber: string;
  notes?: string;
  fileName?: string;
  fileData?: string;
  fileSize?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface NewsletterMetadata {
  publication: string;
  issueNumber?: string;
  readTimeMinutes: number;
  frequency?: string;
  editionTopic?: string;
}

export interface PersonalMetadata {
  relationship?: string;
  reminderDate?: string;
}

export interface SentReplyRecord {
  id: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  bodyText: string;
  sentAt: string;
  method: 'gmail_api' | 'web_compose' | 'system_mail' | 'direct_outbox';
}

export interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  bodyHtml: string;
  receivedAt: string;
  read: boolean;
  starred: boolean;
  category: EmailCategory;
  folderId: string;
  tags: string[];
  brandMeta?: BrandMetadata;
  newsletterMeta?: NewsletterMetadata;
  personalMeta?: PersonalMetadata;
  hasAttachment?: boolean;
  priority?: 'urgent' | 'normal' | 'low';
  sentReplies?: SentReplyRecord[];
}

export interface FolderItem {
  id: string;
  name: string;
  iconName: string;
  count?: number;
  color: string;
  isCustom?: boolean;
  isSystem?: boolean;
  categoryFilter?: EmailCategory;
}

export interface SmartTag {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  categoryDefault?: EmailCategory;
}

export type FilterField = 'sender' | 'subject' | 'body' | 'type' | 'budget';
export type FilterOperator = 'contains' | 'equals' | 'greater_than' | 'starts_with';
export type FilterAction = 'assign_tag' | 'move_to_folder' | 'mark_priority' | 'isolate_personal';

export interface CustomFilterRule {
  id: string;
  name: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
  action: FilterAction;
  actionTarget: string;
  isActive: boolean;
  matchesCount: number;
}

export interface RealtimeAlertItem {
  id: string;
  emailId: string;
  title: string;
  sender: string;
  timestamp: string;
  category: EmailCategory;
  budget?: string;
  read: boolean;
}

export type InboxFocusMode = 'clean_work' | 'all' | 'personal_only';
