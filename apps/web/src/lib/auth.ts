import { db } from "./db";
import { randomToken } from "./crypto";
import { getSession } from "./session";
import { writeAuditLog } from "./audit";

const MAGIC_LINK_TTL_MINUTES = 15;
const SESSION_TTL_DAYS = 30;

/**
 * Passwordless "magic link" flow — real token/expiry/single-use mechanics,
 * but the email is never actually sent (no SMTP configured). The link is
 * surfaced in an in-app "Dev Inbox" screen instead. See QUESTIONS.md #7.
 */
export async function requestMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  let user = await db.user.findUnique({ where: { email: normalized } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: normalized,
        onboardingComplete: false,
      },
    });
    await db.subscription.create({ data: { userId: user.id, planId: "free" } });
  }

  const token = randomToken(24);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
  await db.magicLink.create({ data: { userId: user.id, token, expiresAt } });

  return { userId: user.id, token, expiresAt, isNewUser: !user.onboardingComplete };
}

export async function consumeMagicLink(token: string) {
  const link = await db.magicLink.findUnique({ where: { token } });
  if (!link) return { ok: false as const, reason: "Link not found or already used." };
  if (link.consumedAt) return { ok: false as const, reason: "Link already used." };
  if (link.expiresAt < new Date()) return { ok: false as const, reason: "Link expired. Request a new one." };

  await db.magicLink.update({ where: { id: link.id }, data: { consumedAt: new Date() } });

  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const dbSession = await db.session.create({
    data: { userId: link.userId, expiresAt, device: "web" },
  });

  const session = await getSession();
  session.userId = link.userId;
  session.sessionId = dbSession.id;
  await session.save();

  await writeAuditLog(link.userId, "sign_in", { method: "magic_link" });

  return { ok: true as const, userId: link.userId };
}

export async function signOut() {
  const session = await getSession();
  if (session.sessionId) {
    await db.session.update({ where: { id: session.sessionId }, data: { revokedAt: new Date() } }).catch(() => {});
    await writeAuditLog(session.userId ?? null, "sign_out", {});
  }
  session.destroy();
}

export async function listSessions(userId: string) {
  return db.session.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function revokeSession(userId: string, sessionId: string) {
  await db.session.updateMany({ where: { id: sessionId, userId }, data: { revokedAt: new Date() } });
}
