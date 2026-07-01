import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { MIME_CATEGORY, MAX_SIZE, uploadStream } from '../lib/cloudinary';
import { createExecutableGuard, isBlockedExtension } from '../lib/executableGuard';
import { prisma } from '../lib/prisma';

// Per-user upload rate limit: 20 uploads per minute
const uploadRateLimit = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '1 minute',
      keyGenerator: (req: any) => `upload:${req.user?.sub ?? req.ip}`,
      errorResponseBuilder: () => ({
        error: { code: 'RATE_LIMITED', message: 'Upload limit reached. Max 20 uploads per minute.' },
      }),
    },
  },
};

export async function mediaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /media/upload
  app.post('/upload', uploadRateLimit, async (request, reply) => {
    let part: Awaited<ReturnType<typeof request.file>>;
    try {
      part = await request.file({ limits: { fileSize: MAX_SIZE.document } });
    } catch {
      return reply.status(400).send({ error: { code: 'NO_FILE', message: 'No file provided' } });
    }

    if (!part) {
      return reply.status(400).send({ error: { code: 'NO_FILE', message: 'No file provided' } });
    }

    // 1. Check filename extension against blocked list
    const filename = part.filename || `upload_${Date.now()}`;
    if (isBlockedExtension(filename)) {
      part.file.resume();
      return reply.status(415).send({ error: { code: 'BLOCKED_FILE_TYPE', message: 'This file type is not allowed' } });
    }

    // 2. Validate declared MIME type against allowlist
    const mime = part.mimetype;
    const category = MIME_CATEGORY[mime];
    if (!category) {
      part.file.resume();
      return reply.status(415).send({ error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported file type: ${mime}` } });
    }

    // 3. Pipe through executable magic-bytes guard before sending to Cloudinary
    const guard = createExecutableGuard();
    const guardedStream = part.file.pipe(guard);

    try {
      const result = await uploadStream(guardedStream, category, filename);
      return reply.send(result);
    } catch (err: any) {
      if (err.code === 'BLOCKED_EXECUTABLE') {
        return reply.status(415).send({ error: { code: 'BLOCKED_FILE_TYPE', message: 'Executable file types are not allowed' } });
      }
      app.log.error(err, 'Cloudinary upload failed');
      return reply.status(502).send({ error: { code: 'UPLOAD_FAILED', message: 'Upload to storage failed' } });
    }
  });

  // POST /media/upload-avatar
  app.post('/upload-avatar', uploadRateLimit, async (request, reply) => {
    let part: Awaited<ReturnType<typeof request.file>>;
    try {
      part = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });
    } catch {
      return reply.status(400).send({ error: { code: 'NO_FILE', message: 'No file provided' } });
    }

    if (!part) {
      return reply.status(400).send({ error: { code: 'NO_FILE', message: 'No file provided' } });
    }

    const filename = part.filename || `avatar_${Date.now()}`;

    // Extension check
    if (isBlockedExtension(filename)) {
      part.file.resume();
      return reply.status(415).send({ error: { code: 'BLOCKED_FILE_TYPE', message: 'This file type is not allowed' } });
    }

    // Avatar must be an image MIME type
    const mime = part.mimetype;
    if (!mime.startsWith('image/')) {
      part.file.resume();
      return reply.status(415).send({ error: { code: 'IMAGES_ONLY', message: 'Avatar must be an image' } });
    }

    const userId = request.user.sub;

    // Magic-bytes guard (catches e.g. .exe renamed to .jpg)
    const guard = createExecutableGuard();
    const guardedStream = part.file.pipe(guard);

    try {
      const result = await uploadStream(guardedStream, 'image', `avatar_${userId}`, {
        folder: 'howfar/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
        public_id: `avatar_${userId}`,
        overwrite: true,
        invalidate: true,
      });

      await prisma.user.update({ where: { id: userId }, data: { avatarUrl: result.url } });
      return reply.send({ avatarUrl: result.url });
    } catch (err: any) {
      if (err.code === 'BLOCKED_EXECUTABLE') {
        return reply.status(415).send({ error: { code: 'BLOCKED_FILE_TYPE', message: 'Invalid image file' } });
      }
      app.log.error(err, 'Avatar upload failed');
      return reply.status(502).send({ error: { code: 'UPLOAD_FAILED', message: 'Upload to storage failed' } });
    }
  });
}
