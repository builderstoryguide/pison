import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      roleId?: string | null;
      roleName?: string | null;
      permissions?: string[];
      status: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    roleId?: string | null;
    status: string;
    rememberMe?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    permissions?: string[];
    status: string;
    /** Sentinel: true when roleName/permissions have been hydrated from DB. Avoids re-fetching for legitimately role-less users. */
    _permissionsHydrated?: boolean;
    /** Remember me flag - extends session to 30 days */
    rememberMe?: boolean;
  }
}
