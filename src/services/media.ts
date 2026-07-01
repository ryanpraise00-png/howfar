import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface UploadResult {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  name?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface AvatarUploadResult {
  avatarUrl: string;
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('AUTH_TOKEN');
}

/**
 * Upload any supported media file to /api/media/upload.
 * Uses XMLHttpRequest so we can track upload progress.
 */
export function uploadMedia(
  uri: string,
  name: string,
  mimeType: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise(async (resolve, reject) => {
    const token = await getToken();

    const formData = new FormData();
    formData.append('file', { uri, name, type: mimeType } as any);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/api/media/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid server response')); }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message ?? `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 120_000;

    xhr.send(formData);
  });
}

/**
 * Upload an avatar image to /api/media/upload-avatar.
 * Returns the persisted avatarUrl.
 */
export function uploadAvatar(
  uri: string,
  onProgress?: (percent: number) => void,
): Promise<AvatarUploadResult> {
  return new Promise(async (resolve, reject) => {
    const token = await getToken();

    const formData = new FormData();
    formData.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/api/media/upload-avatar`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid server response')); }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message ?? `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.timeout = 60_000;
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.send(formData);
  });
}
