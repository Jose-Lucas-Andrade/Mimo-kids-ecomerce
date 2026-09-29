import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production' && (!value || value.length < 32)) {
    throw new Error('AUTH_SECRET must contain at least 32 characters in production');
  }
  return new TextEncoder().encode(value || 'dev_secret');
}

export async function createSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token) {
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}
