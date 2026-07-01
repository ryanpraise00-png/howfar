import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

const isProd = process.env.NODE_ENV === 'production';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = error.statusCode ?? 500;
  const context = {
    reqId: request.id,
    method: request.method,
    url: request.url,
    statusCode,
    code: error.code,
  };

  if (statusCode >= 500) {
    // Full error + stack in server logs; never reaches the client
    request.log.error({ err: error, ...context }, 'Server error');
  } else {
    // 4xx — log at warn with enough context to debug, but no stack
    request.log.warn({ ...context, message: error.message }, 'Client error');
  }

  reply.status(statusCode).send({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      // Never expose stack traces or internal messages to clients in production
      message: isProd && statusCode >= 500 ? 'Internal server error' : error.message,
    },
  });
}
