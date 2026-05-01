import { z } from 'zod';

export const DataSubjectRequestType = z.enum(['export', 'delete', 'anonymize']);
export type DataSubjectRequestType = z.infer<typeof DataSubjectRequestType>;

export const DataSubjectType = z.enum(['user', 'customer', 'tenant']);
export type DataSubjectType = z.infer<typeof DataSubjectType>;

export const DataSubjectRequestStatus = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);
export type DataSubjectRequestStatus = z.infer<typeof DataSubjectRequestStatus>;

export const DataSubjectRequest = z.object({
  id: z.string(),
  tenantId: z.string(),
  requestType: DataSubjectRequestType,
  subjectType: DataSubjectType,
  subjectId: z.string(),
  status: DataSubjectRequestStatus,
  dryRun: z.boolean().default(true),
  resultUrl: z.string().optional(),
  resultCount: z.number().int().optional(),
  errorCode: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  requestedBy: z.string(),
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type DataSubjectRequest = z.infer<typeof DataSubjectRequest>;

export const CreateDataSubjectRequest = z.object({
  requestType: DataSubjectRequestType,
  subjectType: DataSubjectType,
  subjectId: z.string().min(1),
  dryRun: z.boolean().default(true),
});
export type CreateDataSubjectRequest = z.infer<typeof CreateDataSubjectRequest>;

export const GdprExportResult = z.object({
  requestId: z.string(),
  tenantId: z.string(),
  subjectType: DataSubjectType,
  subjectId: z.string(),
  recordCount: z.number().int(),
  records: z.array(z.record(z.unknown())),
  redacted: z.boolean().default(true),
  generatedAt: z.string().datetime(),
});
export type GdprExportResult = z.infer<typeof GdprExportResult>;
