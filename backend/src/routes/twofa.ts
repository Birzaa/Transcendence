import { FastifyInstance } from "fastify";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import db from '../database';

export const save2FASecret = (userId: number, secret: string) => {
  const stmt = db.prepare(`UPDATE users SET twofa_secret = ? WHERE id = ?`);
  stmt.run(secret, userId);
};

export const get2FASecret = (userId: number): string | null => {
    const stmt = db.prepare(`SELECT twofa_secret FROM users WHERE id = ?`);
    const row = stmt.get(userId) as { twofa_secret?: string } | undefined;
    return row?.twofa_secret || null;
};

export default async function twoFARoutes(fastify: FastifyInstance) {
  fastify.post("/2fa/setup", async (request, reply) => {
    const { userId, username } = request.body as { userId: number; username: string };

    const secret = speakeasy.generateSecret({
      name: `ft_transcendence (${username})`,
    });

    // Sauvegarde du secret dans la DB
    save2FASecret(userId, secret.base32);

    const otpUrl = secret.otpauth_url!;
    const qrCode = await qrcode.toDataURL(otpUrl);

    return reply.send({ qr: qrCode, secret: secret.base32 });
  });

  fastify.post("/2fa/verify", async (request, reply) => {
    const { userId, token } = request.body as {
      userId: number;
      token: string;
    };

    const userSecret = get2FASecret(userId);
    if (!userSecret) return reply.code(404).send({ error: "No secret found for user" });

    const isValid = speakeasy.totp.verify({
      secret: userSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    return reply.send({ valid: isValid });
  });
}
