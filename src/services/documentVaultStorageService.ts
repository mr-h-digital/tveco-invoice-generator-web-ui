import type { ExportVaultDocument } from '../types/exportJob';

const DOC_UPLOAD_WEBHOOK_URL = import.meta.env.VITE_DOC_UPLOAD_WEBHOOK_URL?.trim();
const DOC_UPLOAD_WEBHOOK_SECRET = import.meta.env.VITE_DOC_UPLOAD_WEBHOOK_SECRET?.trim();

export const isRemoteVaultEnabled = Boolean(DOC_UPLOAD_WEBHOOK_URL);

export interface VaultUploadResult {
  storageProvider: ExportVaultDocument['storageProvider'];
  dataUrl?: string;
  fileUrl?: string;
  objectKey?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadToRemote(file: File, metadata: { jobId: string; category: string; visibleToClient: boolean }): Promise<VaultUploadResult> {
  if (!DOC_UPLOAD_WEBHOOK_URL) {
    throw new Error('Remote upload URL is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('jobId', metadata.jobId);
  formData.append('category', metadata.category);
  formData.append('visibleToClient', String(metadata.visibleToClient));

  const response = await fetch(DOC_UPLOAD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      ...(DOC_UPLOAD_WEBHOOK_SECRET ? { 'x-tveco-doc-secret': DOC_UPLOAD_WEBHOOK_SECRET } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Document upload failed (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as {
    fileUrl?: string;
    objectKey?: string;
  };

  if (!payload.fileUrl) {
    throw new Error('Upload webhook response missing fileUrl');
  }

  return {
    storageProvider: 'REMOTE',
    fileUrl: payload.fileUrl,
    objectKey: payload.objectKey,
  };
}

export const documentVaultStorageService = {
  async upload(file: File, metadata: { jobId: string; category: string; visibleToClient: boolean }): Promise<VaultUploadResult> {
    if (isRemoteVaultEnabled) {
      return uploadToRemote(file, metadata);
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
};
