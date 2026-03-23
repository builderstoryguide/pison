# Agent Permission Refresh Notes

When Agent role permissions are updated in the database, users with an already-issued session token can continue to see stale navigation and access until token claims are refreshed.

## Operational steps

1. Run permission synchronization for Agent/Collector roles:
   - `npm run sync:agent-permissions`
2. Ask connected Agent users to reload the app.
3. If stale menus still appear, ask Agent users to sign out and sign back in.

## Why this happens

Session/JWT claims include `roleName` and `permissions`. If those claims were issued before permission changes, UI filtering can still rely on outdated values.

