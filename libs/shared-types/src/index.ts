export type ReminderStatus = 'SUBSCRIBED' | 'PAUSED';

export type ContactSource = 'manual' | 'google';

export interface BirthdayContact {
  id: number;
  displayName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  source: ContactSource;
  externalContactId: string | null;
  googleContactEtag: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactListResponse {
  contacts: BirthdayContact[];
  limit: number;
  offset: number;
  total: number;
}

export interface SessionSummary {
  userId: number;
  name: string | null;
  status: ReminderStatus;
  googleConnected: boolean;
  googleEmail: string | null;
  googleLastSyncedAt: string | null;
  googleSyncError: string | null;
}

export interface ManualContactInput {
  displayName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
}

export type GoogleSyncStatus = 'NUOVO' | 'AGGIORNATO' | 'GIA IMPORTATO' | 'MANCA COMPLEANNO';

export interface GoogleSyncReportRow {
  birthDay: number | null;
  birthMonth: number | null;
  birthYear: number | null;
  displayName: string;
  status: GoogleSyncStatus;
}

export interface GoogleSyncResult {
  insertedCount: number;
  removedCount: number;
  skippedCount: number;
  missingBirthdayCount: number;
  totalWithBirthday: number;
  updatedCount: number;
  rows: GoogleSyncReportRow[];
}

export type DuplicateConfidence = 'exact' | 'strong' | 'weak';

export interface DuplicateCandidate {
  primary: BirthdayContact;
  duplicate: BirthdayContact;
  confidence: DuplicateConfidence;
  reason: string;
}

export interface MergeDuplicateRequest {
  primaryContactId: number;
  duplicateContactId: number;
}

export interface MergeDuplicatesPayload {
  pairs: MergeDuplicateRequest[];
}
