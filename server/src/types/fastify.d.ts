import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
      phone: string;
      iat?: number;
      exp?: number;
    };
  }
}
