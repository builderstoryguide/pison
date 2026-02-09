---
name: secure-auth-system
description: Implement robust authentication and role-based authorization for the microfinance system. Use when implementing login, logout, session management, password handling, access control, token validation, or protected API endpoints.
---

# Secure Authentication & Authorization

## Quick start

Use this skill for any auth or access-control work. Priorities: security, auditability, and least privilege.

## Core requirements

- Hash passwords with bcrypt (min cost 12), enforce strong password rules.
- Do not leak sensitive data in logs or error messages.
- Implement account lockout after repeated failed logins.
- Use short-lived access tokens and refresh token rotation.
- Persist sessions server-side and validate them on each request.
- Apply role-based access control (ADMINISTRATOR, ACCOUNTANT, AGENT, CLIENT).
- Log all auth events to audit logs (success, failure, lockout, logout).

## Implementation checklist

1. **Password handling**
   - Validate strength before hashing.
   - Store only password hashes.
2. **Login**
   - Look up active user.
   - Check lockout status.
   - Verify password.
   - Reset failed attempts on success.
   - Create session and issue tokens.
3. **Refresh**
   - Validate refresh token.
   - Verify session and user status.
   - Rotate refresh token family.
4. **Logout**
   - Invalidate session.
   - Log logout event.
5. **Middleware**
   - Authenticate with Bearer token.
   - Authorize by role or permission.
   - Check session validity on each request.
6. **Resource access**
   - Enforce ownership rules (agent/clients).

## Testing

- Login success and failure paths.
- Account lockout after 5 attempts.
- Refresh token rotation.
- Role-based access restrictions.
- Resource ownership checks.

## Additional resources

- Full reference implementation and examples: [reference.md](reference.md)
