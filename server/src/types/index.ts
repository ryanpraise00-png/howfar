// Shared TypeScript types — expanded in subsequent sections.

export interface JwtPayload {
  sub: string;    // userId
  phone: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
