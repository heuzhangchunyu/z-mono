import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthConfig } from '../config/env.js';
import type { AccessTokenClaims } from '../model/auth.js';
import type { UserRecord } from '../model/user.js';

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const TOKEN_ALIGN_HOUR = 4;
const TOKEN_ALIGN_MINUTE = 0;

export class AuthService {
  constructor(private readonly authConfig: AuthConfig) {}

  normalizeUsername(username: string) {
    return username.trim();
  }

  normalizeNickname(nickname: string, fallbackUsername: string) {
    const normalizedNickname = nickname.trim();
    return normalizedNickname || fallbackUsername;
  }

  hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64, {
      N: 16384,
      r: 8,
      p: 1
    });

    return ['scrypt', 16384, 8, 1, salt, derivedKey.toString('hex')].join('$');
  }

  verifyPassword(password: string, passwordHash: string) {
    const [algorithm, nValue, rValue, pValue, salt, expectedHash] = passwordHash.split('$');

    if (
      algorithm !== 'scrypt' ||
      !nValue ||
      !rValue ||
      !pValue ||
      !salt ||
      !expectedHash
    ) {
      return false;
    }

    const derivedKey = crypto.scryptSync(password, salt, 64, {
      N: Number(nValue),
      r: Number(rValue),
      p: Number(pValue)
    });
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    return derivedKey.length === expectedBuffer.length &&
      crypto.timingSafeEqual(derivedKey, expectedBuffer);
  }

  async createAccessToken(user: UserRecord) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expireAt = Math.floor(this.calculateTokenExpireAt().getTime() / 1000);
    const token = await new SignJWT({
      user_id: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT'
      })
      .setIssuedAt(issuedAt)
      .setExpirationTime(expireAt)
      .sign(this.getJwtSecret());

    return {
      token,
      tokenExpireAt: expireAt
    };
  }

  async verifyAccessToken(token: string) {
    try {
      const { payload, protectedHeader } = await jwtVerify(token, this.getJwtSecret(), {
        algorithms: ['HS256']
      });

      if (protectedHeader.typ !== 'JWT') {
        return null;
      }

      if (
        typeof payload.user_id !== 'number' ||
        typeof payload.username !== 'string' ||
        typeof payload.role !== 'string' ||
        typeof payload.exp !== 'number' ||
        typeof payload.iat !== 'number'
      ) {
        return null;
      }

      return {
        user_id: payload.user_id,
        username: payload.username,
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat
      } satisfies AccessTokenClaims;
    } catch {
      return null;
    }
  }

  private calculateTokenExpireAt() {
    const durationMs = this.authConfig.tokenExpireHours * 60 * 60 * 1000;
    const baseExpireAt = new Date(Date.now() + durationMs);
    const baseExpireAtInBeijing = new Date(baseExpireAt.getTime() + BEIJING_OFFSET_MS);

    if (
      baseExpireAtInBeijing.getUTCHours() === TOKEN_ALIGN_HOUR &&
      baseExpireAtInBeijing.getUTCMinutes() === TOKEN_ALIGN_MINUTE &&
      baseExpireAtInBeijing.getUTCSeconds() === 0 &&
      baseExpireAtInBeijing.getUTCMilliseconds() === 0
    ) {
      return baseExpireAt;
    }

    let nextAlignedTimeInBeijing = new Date(
      Date.UTC(
        baseExpireAtInBeijing.getUTCFullYear(),
        baseExpireAtInBeijing.getUTCMonth(),
        baseExpireAtInBeijing.getUTCDate(),
        TOKEN_ALIGN_HOUR,
        TOKEN_ALIGN_MINUTE,
        0,
        0
      )
    );

    if (nextAlignedTimeInBeijing.getTime() <= baseExpireAtInBeijing.getTime()) {
      nextAlignedTimeInBeijing = new Date(nextAlignedTimeInBeijing.getTime() + 24 * 60 * 60 * 1000);
    }

    return new Date(nextAlignedTimeInBeijing.getTime() - BEIJING_OFFSET_MS);
  }

  private getJwtSecret() {
    return new TextEncoder().encode(this.authConfig.jwtSecret);
  }
}
