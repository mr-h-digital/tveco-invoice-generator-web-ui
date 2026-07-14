import api from './api';
import type { ExportVaultDocument } from '../types/exportJob';

const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.PROD;
const SIGNED_URL_CACHE_TTL_MS = 60000;

export const isRemoteVaultEnabled = USE_API;
export const isSignedDownloadEnabled = USE_API;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const inFlightSignedUrlRequests = new Map<string, Promise<string>>();

type UploadScope = 'admin' | 'client';
type DownloadScope = 'admin' | 'client' | 'tracking';

interface SignedUploadInitResponse {
  documentId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders?: Record<string, string>;
}

interface SignedDownloadUrlResponse {
  url: string;
  expiresAt: string;
}

export interface VaultUploadResult {
  storageProvider: ExportVaultDocument['storageProvider'];
  dataUrl?: string;
  fileUrl?: string;
  objectKey?: string;
}

async function requestSignedDownloadUrl(cacheKey: string, path: string, fallbackUrl?: string): Promise<string> {
  const now = Date.now();
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const inFlight = inFlightSignedUrlRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    if (!USE_API) {
      if (!fallbackUrl) throw new Error('Document signing URL is not configured');
      return fallbackUrl;
    }

    try {
      const response = await api.post<SignedDownloadUrlResponse>(path);
      if (!response.data?.url) {
        if (fallbackUrl) return fallbackUrl;
        throw new Error('Signed URL response missing url');
      }

      const expiresAt = Date.parse(response.data.expiresAt);
      signedUrlCache.set(cacheKey, {
        url: response.data.url,
        expiresAt: Number.isFinite(expiresAt) ? expiresAt : now + SIGNED_URL_CACHE_TTL_MS,
      });

      return response.data.url;
    } catch {
      if (fallbackUrl) return fallbackUrl;
      throw new Error('Signed URL request failed');
    }
  })();

  inFlightSignedUrlRequests.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    inFlightSignedUrlRequests.delete(cacheKey);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadViaSignedUrl(
  file: File,
  metadata: { jobId: string; category: string; visibleToClient: boolean; scope: UploadScope }
): Promise<VaultUploadResult> {
  const basePath = metadata.scope === 'client' ? `/client-portal/jobs/${metadata.jobId}` : `/export-jobs/${metadata.jobId}`;
  const initResponse = await api.post<SignedUploadInitResponse>(`${basePath}/documents/init-upload`, {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    category: metadata.category,
    visibleToClient: metadata.visibleToClient,
  });

  const payload = initResponse.data;
  const headers = new Headers(payload.requiredHeaders ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', file.type || 'application/octet-stream');
  }

  const uploadResponse = await fetch(payload.uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Document upload failed (HTTP ${uploadResponse.status})`);
  }

  await api.post(`${basePath}/documents/${payload.documentId}/complete-upload`, {});

  return {
    storageProvider: 'REMOTE',
    objectKey: payload.objectKey,
  };
}

export const documentVaultStorageService = {
  async upload(
    file: File,
    metadata: { jobId: string; category: string; visibleToClient: boolean; scope: UploadScope }
  ): Promise<VaultUploadResult> {
    if (USE_API) {
      return uploadViaSignedUrl(file, metadata);
    }

    const dataUrl = await fileToDataUrl(file);
    return {
      storageProvider: 'LOCAL',
      dataUrl,
    };
  },

  getDownloadUrl(doc: Pick<ExportVaultDocument, 'fileUrl' | 'dataUrl'>): string | null {
    return doc.fileUrl ?? doc.dataUrl ?? null;
  },

  async resolveDownloadUrl(
    doc: Pick<ExportVaultDocument, 'id' | 'storageProvider' | 'objectKey' | 'fileUrl' | 'dataUrl'>,
    metadata?: { scope: DownloadScope; jobId?: string; trackingToken?: string }
  ): Promise<string | null> {
    if (doc.storageProvider === 'LOCAL') {
      return doc.dataUrl ?? null;
    }

    if (USE_API && doc.objectKey && metadata?.scope && doc.id) {
      const cacheKey = `${metadata.scope}:${doc.id}:${metadata.jobId ?? metadata.trackingToken ?? ''}`;

      if (metadata.scope === 'tracking' && metadata.trackingToken) {
        return requestSignedDownloadUrl(
          cacheKey,
          `/export-jobs/tracking/${encodeURIComponent(metadata.trackingToken)}/documents/${doc.id}/download-url`,
          doc.fileUrl
        );
      }

      if (metadata.jobId) {
        const basePath = metadata.scope === 'client' ? `/client-portal/jobs/${metadata.jobId}` : `/export-jobs/${metadata.jobId}`;
        return requestSignedDownloadUrl(cacheKey, `${basePath}/documents/${doc.id}/download-url`, doc.fileUrl);
      }
    }

    return doc.fileUrl ?? null;
  },

  clearSignedUrlCache(cacheKey?: string) {
    if (cacheKey) {
      signedUrlCache.delete(cacheKey);
      inFlightSignedUrlRequests.delete(cacheKey);
      return;
    }
    signedUrlCache.clear();
    inFlightSignedUrlRequests.clear();
  },
};
