import { SignJWT, jwtVerify } from 'jose';
import { NexusTokenPayload } from './types';
import { config, validateConfig } from './config';

// Validate configuration on module load
validateConfig();

const getSecret = () => {
  return new TextEncoder().encode(config.jwtSecret);
};

const TOKEN_EXPIRY = config.tokenExpiry;

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
