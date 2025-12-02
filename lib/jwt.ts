import { SignJWT, jwtVerify } from 'jose';
import { NexusTokenPayload } from './types';

const getSecret = () => {
  const secret = process.env.NEXUS_JWT_SECRET || 'nexus-dev-secret-change-in-production-32chars';
  return new TextEncoder().encode(secret);
};

const TOKEN_EXPIRY = process.env.NEXUS_TOKEN_EXPIRY || '24h';

export async function createToken(payload: Omit<NexusTokenPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getSecret();

  const token = await new SignJWT({
    ...payload,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<NexusTokenPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as NexusTokenPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(): string {
  return TOKEN_EXPIRY;
}
