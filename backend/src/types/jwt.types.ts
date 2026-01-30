export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  tokenType: "access" | "refresh";
  iat: number;
  exp: number;
}

export interface VerifyTokenResult {
  valid: boolean;
  expired: boolean;
  decoded: DecodedToken | null;
  error?: string;
}
