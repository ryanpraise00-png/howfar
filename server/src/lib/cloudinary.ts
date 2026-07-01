import { v2 as cloudinary } from 'cloudinary';
import type { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type MediaCategory = 'image' | 'video' | 'audio' | 'document';

export const MIME_CATEGORY: Record<string, MediaCategory> = {
  'image/jpeg':    'image',
  'image/png':     'image',
  'image/webp':    'image',
  'image/gif':     'image',
  'video/mp4':     'video',
  'audio/aac':     'audio',
  'audio/mp4':     'audio',
  'audio/mpeg':    'audio',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
};

export const MAX_SIZE: Record<MediaCategory, number> = {
  image:    16 * 1024 * 1024,
  video:    64 * 1024 * 1024,
  audio:    16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

const FOLDER: Record<MediaCategory, string> = {
  image:    'howfar/images',
  video:    'howfar/videos',
  audio:    'howfar/audio',
  document: 'howfar/docs',
};

const RESOURCE_TYPE: Record<MediaCategory, 'image' | 'video' | 'raw'> = {
  image:    'image',
  video:    'video',
  audio:    'video', // Cloudinary treats audio as video resource
  document: 'raw',
};

export interface UploadResult {
  url: string;
  type: MediaCategory;
  size: number;
  name?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export function uploadStream(
  stream: Readable,
  category: MediaCategory,
  filename: string,
  extraOptions: Record<string, unknown> = {},
): Promise<UploadResult & { publicId: string }> {
  return new Promise((resolve, reject) => {
    const opts: Record<string, unknown> = {
      folder: FOLDER[category],
      resource_type: RESOURCE_TYPE[category],
      public_id: `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      ...extraOptions,
    };

    const upStream = cloudinary.uploader.upload_stream(
      opts as any,
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          type: category,
          size: result.bytes,
          name: filename,
          duration: (result as any).duration ?? undefined,
          width: result.width ?? undefined,
          height: result.height ?? undefined,
        });
      },
    );

    stream.pipe(upStream);
  });
}
