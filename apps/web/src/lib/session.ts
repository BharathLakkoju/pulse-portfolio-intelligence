import { cookies } from "next/headers";
import { getIronSession, type IronSessionData } from "iron-session";
import { db } from "./db";

declare module "iron-session" {
  interface IronSessionData {
    userId?: string;
    sessionId?: string;
  }
}

const sessionSecret = process.env.SESSION_SECRET || "dev-only-insecure-session-secret-change-before-any-deployment";

export const sessionOptions = {
  password: sessionSecret,
  cookieName: "pulse_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = cookies();
  return getIronSession<IronSessionData>(cookieStore, sessionOptions);
}

export interface AuthedUser {
  id: string;
  email: string;
  name: string | null;
  country: string;
  taxResidency: string;
  baseCurrency: string;
  investorProfile: string;
  onboardingComplete: boolean;
}

/** Returns the current authenticated user, or null. Never trusts client-provided identity. */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const session = await getSession();
  if (!session.userId || !session.sessionId) return null;

  const dbSession = await db.session.findUnique({ where: { id: session.sessionId } });
  if (!dbSession || dbSession.revokedAt || dbSession.expiresAt < new Date()) return null;

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    country: user.country,
    taxResidency: user.taxResidency,
    baseCurrency: user.baseCurrency,
    investorProfile: user.investorProfile,
    onboardingComplete: user.onboardingComplete,
  };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
