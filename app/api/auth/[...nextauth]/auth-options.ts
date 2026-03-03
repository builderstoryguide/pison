import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

// ──────────────────────────────────────────────────────────────────
// Authentication configuration for the DCMS microfinance system.
//
// Security features:
//   - Database user lookup with active-status check
//   - bcrypt password verification
//   - Account lockout after 5 consecutive failed attempts (15 min)
//   - Client role rejection (per PRD Special Notation #1)
//   - Audit logging for all auth events
//   - "Remember me" extends session to 30 days
// ──────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'text' },
      },

      async authorize(credentials) {
        const identifier = credentials?.identifier ?? credentials?.email;
        if (!identifier || !credentials?.password) {
          throw new Error(
            JSON.stringify({
              message: 'Username/email and password are required.',
            }),
          );
        }

        const normalizedIdentifier = identifier.toLowerCase().trim();

        // 1. Look up user by username or email (include role)
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedIdentifier },
              { username: normalizedIdentifier },
            ],
          },
          include: { role: true },
        });

        if (!user) {
          throw new Error(
            JSON.stringify({
              message: 'Invalid username/email or password.',
            }),
          );
        }

        // 2. Check if user has a password set (OAuth-only users can't use credentials)
        if (!user.password) {
          throw new Error(
            JSON.stringify({
              message: 'This account does not support password login. Please use another sign-in method.',
            }),
          );
        }

        // 3. Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMs = user.lockedUntil.getTime() - Date.now();
          const remainingMin = Math.ceil(remainingMs / 60000);

          // Log lockout attempt
          await logAuthEvent(user.id, 'LOGIN_LOCKED', `Account locked. ${remainingMin} minute(s) remaining.`);

          throw new Error(
            JSON.stringify({
              message: `Account is temporarily locked. Please try again in ${remainingMin} minute(s).`,
            }),
          );
        }

        // 4. Check user status
        if (user.status === 'INACTIVE') {
          throw new Error(
            JSON.stringify({
              message: 'Your account is not yet verified. Please check your email for the verification link.',
            }),
          );
        }

        if (user.status === 'BLOCKED') {
          await logAuthEvent(user.id, 'LOGIN_BLOCKED', 'Blocked account login attempt.');

          throw new Error(
            JSON.stringify({
              message: 'Your account has been blocked. Please contact a manager.',
            }),
          );
        }

        // 5. Check soft-delete
        if (user.isTrashed) {
          throw new Error(
            JSON.stringify({
              message: 'Invalid username/email or password.',
            }),
          );
        }

        // 6. Reject Client role (per PRD: clients must not access the system)
        const roleLower = user.role.slug?.toLowerCase() ?? '';
        if (roleLower === 'client') {
          await logAuthEvent(user.id, 'LOGIN_REJECTED', 'Client role login attempt rejected.');

          throw new Error(
            JSON.stringify({
              message: 'Client accounts do not have system access. Please contact your agent or accountant.',
            }),
          );
        }

        // 7. Verify password
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatch) {
          // Increment failed attempts
          const newAttempts = user.failedLoginAttempts + 1;
          const updateData: Record<string, unknown> = {
            failedLoginAttempts: newAttempts,
          };

          // Lock account if threshold reached
          if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            updateData.lockedUntil = new Date(
              Date.now() + LOCKOUT_DURATION_MS,
            );
            await logAuthEvent(
              user.id,
              'ACCOUNT_LOCKED',
              `Account locked after ${newAttempts} failed attempts.`,
            );
          } else {
            await logAuthEvent(
              user.id,
              'LOGIN_FAILED',
              `Invalid password. Attempt ${newAttempts}/${MAX_FAILED_ATTEMPTS}.`,
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            throw new Error(
              JSON.stringify({
                message: `Too many failed attempts. Your account has been locked for 15 minutes.`,
              }),
            );
          }

          throw new Error(
            JSON.stringify({
              message: 'Invalid username/email or password.',
            }),
          );
        }

        // 8. Successful login — reset lockout counters and update last sign-in
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastSignInAt: new Date(),
          },
        });

        // Parse rememberMe from credentials (comes as string "true"/"false")
        const rememberMe = credentials.rememberMe === 'true';

        await logAuthEvent(
          user.id,
          'LOGIN_SUCCESS',
          `User logged in successfully.${rememberMe ? ' (Remember me enabled)' : ''}`,
        );

        // 9. Return user object for JWT (include rememberMe flag)
        return {
          id: user.id,
          email: user.email,
          username: user.username ?? undefined,
          name: user.name ?? '',
          avatar: user.avatar,
          roleId: user.roleId,
          status: user.status,
          rememberMe,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    // Cookie maxAge set to 30 days; actual session validity controlled by JWT exp claim
    // Without "Remember me": JWT expires in 24 hours
    // With "Remember me": JWT expires in 30 days
    maxAge: REMEMBER_ME_MAX_AGE,
  },

  callbacks: {
    async jwt({
      token,
      user,
      session,
      trigger,
    }: {
      token: JWT;
      user: User;
      session?: Session;
      trigger?: 'signIn' | 'signUp' | 'update';
    }) {
      // Handle session update (e.g. profile changes)
      if (trigger === 'update' && session?.user) {
        token = { ...token, ...session.user };
        return token;
      }

      // On initial sign-in, hydrate token from DB user
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;
        token.avatar = user.avatar;
        token.status = user.status;
        token.roleId = user.roleId;
        token.rememberMe = user.rememberMe;

        // Set token expiry based on "Remember me" preference
        // NextAuth uses `exp` claim for JWT expiry
        const maxAge = user.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;

        // Fetch role name and permissions from DB (for client-side permission checks)
        if (user.roleId) {
          const role = await prisma.userRole.findUnique({
            where: { id: user.roleId },
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          });
          token.roleName = role?.name ?? null;
          token.permissions =
            role?.permissions
              ?.map((rp) => rp.permission?.slug)
              .filter((slug): slug is string => Boolean(slug)) ?? [];
        } else {
          token.roleName = null;
          token.permissions = [];
        }
        token._permissionsHydrated = true;
      }

      // Hydrate role info when not yet hydrated (handles old sessions, token refresh, edge cases)
      // Use sentinel to avoid re-fetching for legitimately role-less users (roleName null, permissions [])
      if (token.roleId && !token._permissionsHydrated) {
        const role = await prisma.userRole.findUnique({
          where: { id: token.roleId },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });
        token.roleName = role?.name ?? null;
        token.permissions =
          role?.permissions
            ?.map((rp) => rp.permission?.slug)
            .filter((slug): slug is string => Boolean(slug)) ?? [];
        token._permissionsHydrated = true;
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.avatar = token.avatar;
        session.user.status = token.status;
        session.user.roleId = token.roleId;
        session.user.roleName = token.roleName;
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },

  pages: {
    signIn: '/signin',
  },
};

// ─── Audit logging helper ───────────────────────────────────────

async function logAuthEvent(
  userId: string,
  action: string,
  description: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: 'USER',
        entityId: userId,
        description,
      },
    });
  } catch {
    // Audit logging should never break auth flow
    console.error(`[Auth Audit] Failed to log: ${action} for user ${userId}`);
  }
}

export default authOptions;
export { authOptions };
