# Secure Authentication & Authorization Skill (Reference)

## Purpose
This reference contains the full guidance, examples, and code patterns for the
secure auth system skill. Use it when implementing or reviewing auth flows.

## When to Use This Skill
- Implementing user login/logout
- Password management (hashing, reset, change)
- Session management
- Role-based access control
- Permission checks
- API endpoint protection
- Token generation and validation

## User Roles

The system has four distinct roles with different permissions:

1. **ADMINISTRATOR**
   - Full system access
   - Transaction approval authority
   - User management (create, edit, delete all user types)
   - System configuration
   - View all reports
   - Close accounting day

2. **ACCOUNTANT**
   - Create client and agent accounts
   - Process deposits and withdrawals for clients at office
   - View transaction history
   - Generate financial reports
   - Manage agent account balances
   - Cannot approve transactions (requires admin)

3. **AGENT** (Collection Agent)
   - Enter collected amounts (ventilation)
   - View clients in assigned collection areas only
   - View own transaction history
   - Generate daily collection reports
   - Cannot create accounts
   - Cannot approve transactions

4. **CLIENT**
   - View own account balance
   - View own transaction history
   - Request account statement
   - Read-only access

## Authentication Implementation

### Password Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Minimum 12 for production

class PasswordService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(plainPassword: string): Promise<string> {
    // Validate password strength first
    this.validatePasswordStrength(plainPassword);
    
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hash;
  }
  
  /**
   * Verify a password against a hash
   */
  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }
  
  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError(
        'Password must contain uppercase, lowercase, numbers, and special characters'
      );
    }
    
    // Check against common passwords list
    if (this.isCommonPassword(password)) {
      throw new ValidationError('Password is too common. Please choose a stronger password');
    }
  }
  
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', 'Password1!', '12345678', 'qwerty123', 
      // Add more common passwords
    ];
    return commonPasswords.includes(password);
  }
}
```

### JWT Authentication

```typescript
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  sessionId: string;
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenFamily: string;
}

class AuthService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string = '15m';
  private refreshTokenExpiry: string = '7d';
  
  constructor(
    private db: Database,
    private auditLogger: AuditLogger,
    private passwordService: PasswordService
  ) {
    // Load from environment variables
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets not configured');
    }
  }
  
  /**
   * Authenticate user and create session
   */
  async login(
    username: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    try {
      // Step 1: Find user
      const user = await this.db.findOne('users', { 
        username,
        status: 'ACTIVE'
      });
      
      if (!user) {
        // Log failed attempt
        await this.auditLogger.log({
          action: 'LOGIN_FAILED',
          entityType: 'USER',
          metadata: { username, reason: 'USER_NOT_FOUND', ipAddress }
        });
        
        // Generic error message to prevent user enumeration
        throw new AuthenticationError('Invalid credentials');
      }
      
      // Step 2: Check account lockout
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await this.auditLogger.log({
          userId: user.id,
          action: 'LOGIN_FAILED',
          entityType: 'USER',
          metadata: { reason: 'ACCOUNT_LOCKED', ipAddress }
        });
        
        throw new AccountLockedError(
          `Account is locked until ${user.lockedUntil.toISOString()}`
        );
      }
      
      // Step 3: Verify password
      const isValidPassword = await this.passwordService.verifyPassword(
        password,
        user.passwordHash
      );
      
      if (!isValidPassword) {
        // Increment failed attempts
        await this.handleFailedLogin(user.id, ipAddress);
        
        throw new AuthenticationError('Invalid credentials');
      }
      
      // Step 4: Reset failed attempts on successful login
      await this.db.update('users', 
        { id: user.id },
        { 
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress
        }
      );
      
      // Step 5: Create session
      const sessionId = uuidv4();
      const tokenFamily = uuidv4(); // For refresh token rotation
      
      await this.db.insert('sessions', {
        id: sessionId,
        userId: user.id,
        tokenFamily,
        ipAddress,
        userAgent,
        expiresAt: this.calculateExpiry(this.refreshTokenExpiry),
        createdAt: new Date()
      });
      
      // Step 6: Generate tokens
      const accessToken = this.generateAccessToken({
        userId: user.id,
        username: user.username,
        role: user.role,
        sessionId
      });
      
      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        sessionId,
        tokenFamily
      });
      
      // Step 7: Log successful login
      await this.auditLogger.log({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'USER',
        metadata: { ipAddress, userAgent }
      });
      
      // Remove sensitive data before returning
      const { passwordHash, ...safeUser } = user;
      
      return {
        accessToken,
        refreshToken,
        user: safeUser
      };
      
    } catch (error) {
      // Log error (without sensitive details)
      console.error('Login error:', error.message);
      throw error;
    }
  }
  
  /**
   * Handle failed login attempts with account lockout
   */
  private async handleFailedLogin(userId: string, ipAddress: string): Promise<void> {
    const user = await this.db.findOne('users', { id: userId });
    const attempts = (user.failedLoginAttempts || 0) + 1;
    
    const updateData: any = {
      failedLoginAttempts: attempts
    };
    
    // Lock account after 5 failed attempts
    if (attempts >= 5) {
      // Lock for 30 minutes
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      
      await this.auditLogger.log({
        userId,
        action: 'ACCOUNT_LOCKED',
        entityType: 'USER',
        metadata: { attempts, ipAddress }
      });
    }
    
    await this.db.update('users', { id: userId }, updateData);
    
    await this.auditLogger.log({
      userId,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      metadata: { attempts, reason: 'INVALID_PASSWORD', ipAddress }
    });
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken,
        this.refreshTokenSecret
      ) as RefreshTokenPayload;
      
      // Check if session exists and is valid
      const session = await this.db.findOne('sessions', {
        id: payload.sessionId,
        tokenFamily: payload.tokenFamily
      });
      
      if (!session) {
        throw new AuthenticationError('Invalid refresh token');
      }
      
      if (session.expiresAt < new Date()) {
        throw new AuthenticationError('Refresh token expired');
      }
      
      // Get user
      const user = await this.db.findOne('users', { id: payload.userId });
      
      if (!user || user.status !== 'ACTIVE') {
        throw new AuthenticationError('User not found or inactive');
      }
      
      // Generate new tokens (refresh token rotation)
      const newTokenFamily = uuidv4();
      
      // Update session
      await this.db.update('sessions',
        { id: session.id },
        { 
          tokenFamily: newTokenFamily,
          lastActivityAt: new Date()
        }
      );
      
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        username: user.username,
        role: user.role,
        sessionId: session.id
      });
      
      const newRefreshToken = this.generateRefreshToken({
        userId: user.id,
        sessionId: session.id,
        tokenFamily: newTokenFamily
      });
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
      
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }
  
  /**
   * Logout and invalidate session
   */
  async logout(sessionId: string, userId: string): Promise<void> {
    await this.db.delete('sessions', { id: sessionId });
    
    await this.auditLogger.log({
      userId,
      action: 'LOGOUT',
      entityType: 'USER',
      metadata: { sessionId }
    });
  }
  
  /**
   * Generate access token
   */
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'microfinance-system',
      audience: 'microfinance-api'
    });
  }
  
  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'microfinance-system',
      audience: 'microfinance-api'
    });
  }
  
  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'microfinance-system',
        audience: 'microfinance-api'
      }) as TokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
  
  private calculateExpiry(duration: string): Date {
    // Parse duration like '7d', '15m', '1h'
    const value = parseInt(duration);
    const unit = duration.slice(-1);
    
    const now = Date.now();
    
    switch (unit) {
      case 'm':
        return new Date(now + value * 60 * 1000);
      case 'h':
        return new Date(now + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid duration format');
    }
  }
}
```

## Authorization Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: UserRole;
        sessionId: string;
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const authService = new AuthService(db, auditLogger, passwordService);
    const payload = authService.verifyAccessToken(token);
    
    // Attach user info to request
    req.user = payload;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed'
      }
    });
  }
}

/**
 * Authorization middleware - checks user role
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      auditLogger.log({
        userId: req.user.userId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entityType: 'API',
        metadata: {
          endpoint: req.path,
          method: req.method,
          requiredRoles: allowedRoles,
          userRole: req.user.role
        }
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    
    next();
  };
}

/**
 * Permission-based authorization (more granular than role-based)
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
    }
    
    // Check if user has permission
    const hasPermission = await checkUserPermission(req.user.userId, permission);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission '${permission}' required`
        }
      });
    }
    
    next();
  };
}

/**
 * Check if user has specific permission
 */
async function checkUserPermission(userId: string, permission: string): Promise<boolean> {
  // Get user with role
  const user = await db.findOne('users', { id: userId });
  
  // Define role-permission mappings
  const rolePermissions: Record<UserRole, string[]> = {
    ADMINISTRATOR: [
      'transactions.approve',
      'transactions.view_all',
      'transactions.reverse',
      'users.create',
      'users.edit',
      'users.delete',
      'reports.view_all',
      'system.close_day',
      'system.configure'
    ],
    ACCOUNTANT: [
      'transactions.create',
      'transactions.view_assigned',
      'clients.create',
      'clients.edit',
      'agents.create',
      'agents.edit',
      'reports.view_assigned',
      'accounts.deposit',
      'accounts.withdraw'
    ],
    AGENT: [
      'collections.create',
      'clients.view_assigned',
      'transactions.view_own',
      'reports.view_own'
    ],
    CLIENT: [
      'account.view_own',
      'transactions.view_own',
      'statement.request'
    ]
  };
  
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}
```

## Route Protection Examples

```typescript
import express from 'express';

const router = express.Router();

// Public route - no authentication required
router.post('/auth/login', loginController);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Client routes - all authenticated users can access their own data
router.get('/profile', profileController);

// Transaction routes
router.post('/transactions',
  authorize(['AGENT', 'ACCOUNTANT', 'ADMINISTRATOR']),
  createTransactionController
);

router.post('/transactions/:id/approve',
  authorize(['ADMINISTRATOR']),
  approveTransactionController
);

// User management - admin only
router.post('/users',
  authorize(['ADMINISTRATOR']),
  createUserController
);

router.put('/users/:id',
  authorize(['ADMINISTRATOR', 'ACCOUNTANT']), // Accountants can create some users
  updateUserController
);

// Reports - different access levels
router.get('/reports/daily-collections',
  authorize(['AGENT', 'ACCOUNTANT', 'ADMINISTRATOR']),
  async (req, res) => {
    // Agents can only see their own area
    if (req.user!.role === 'AGENT') {
      // Filter by agent's assigned areas
      const agent = await getAgent(req.user!.userId);
      req.query.areaIds = agent.assignedAreas;
    }
    
    // Proceed with report generation
    const report = await generateDailyCollectionReport(req.query);
    res.json({ success: true, data: report });
  }
);

// Admin-only routes
router.post('/system/close-day',
  authorize(['ADMINISTRATOR']),
  closeDayController
);

// Permission-based route
router.post('/transactions/:id/reverse',
  requirePermission('transactions.reverse'),
  reverseTransactionController
);
```

## Resource-Based Authorization

For operations on specific resources (e.g., an agent should only see clients in their area):

```typescript
/**
 * Check if user can access a specific resource
 */
async function canAccessResource(
  userId: string,
  resourceType: string,
  resourceId: string,
  operation: string
): Promise<boolean> {
  const user = await db.findOne('users', { id: userId });
  
  // Administrators can access everything
  if (user.role === 'ADMINISTRATOR') {
    return true;
  }
  
  switch (resourceType) {
    case 'client':
      if (user.role === 'AGENT') {
        // Agent can only access clients in their assigned areas
        const client = await db.findOne('clients', { id: resourceId });
        const agent = await db.findOne('agents', { userId: user.id });
        
        return agent.assignedAreas.includes(client.areaId);
      }
      
      if (user.role === 'ACCOUNTANT') {
        // Accountants can access all clients
        return true;
      }
      
      if (user.role === 'CLIENT') {
        // Clients can only access their own data
        const client = await db.findOne('clients', { userId: user.id });
        return client.id === resourceId;
      }
      break;
      
    case 'transaction':
      if (user.role === 'AGENT') {
        // Agent can only access transactions they created
        const transaction = await db.findOne('transactions', { id: resourceId });
        return transaction.createdBy === userId;
      }
      
      if (user.role === 'CLIENT') {
        // Client can only access their own transactions
        const transaction = await db.findOne('transactions', { id: resourceId });
        const client = await db.findOne('clients', { userId: user.id });
        return transaction.accountId === client.accountId;
      }
      break;
  }
  
  return false;
}

/**
 * Middleware to check resource access
 */
export function checkResourceAccess(resourceType: string, idParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[idParam];
    const operation = req.method.toLowerCase();
    
    const canAccess = await canAccessResource(
      req.user!.userId,
      resourceType,
      resourceId,
      operation
    );
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this resource'
        }
      });
    }
    
    next();
  };
}

// Usage
router.get('/clients/:id',
  authenticate,
  authorize(['AGENT', 'ACCOUNTANT', 'ADMINISTRATOR']),
  checkResourceAccess('client'),
  getClientController
);
```

## Session Management

```typescript
/**
 * Middleware to check session validity
 */
export async function checkSession(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }
  
  // Check if session exists and is valid
  const session = await db.findOne('sessions', {
    id: req.user.sessionId,
    userId: req.user.userId
  });
  
  if (!session) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'SESSION_INVALID',
        message: 'Session not found or expired'
      }
    });
  }
  
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await db.delete('sessions', { id: session.id });
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Session has expired'
      }
    });
  }
  
  // Update last activity
  await db.update('sessions',
    { id: session.id },
    { lastActivityAt: new Date() }
  );
  
  next();
}

/**
 * Logout from all devices
 */
async function logoutAllDevices(userId: string): Promise<void> {
  await db.delete('sessions', { userId });
  
  await auditLogger.log({
    userId,
    action: 'LOGOUT_ALL_DEVICES',
    entityType: 'USER'
  });
}

/**
 * Get active sessions for user
 */
async function getActiveSessions(userId: string): Promise<Session[]> {
  return await db.find('sessions', {
    userId,
    expiresAt: { $gt: new Date() }
  });
}
```

## Security Best Practices

1. **Password Security**
   - Never store plain text passwords
   - Use bcrypt with minimum cost factor of 12
   - Enforce strong password requirements
   - Implement password expiration (optional)
   - Prevent password reuse

2. **Token Security**
   - Use short expiration for access tokens (15 minutes)
   - Use HttpOnly, Secure cookies for token storage
   - Implement refresh token rotation
   - Invalidate tokens on logout
   - Store refresh tokens securely

3. **Session Security**
   - Implement session timeout
   - Track session activity
   - Allow users to view/revoke active sessions
   - Limit concurrent sessions (optional)

4. **Account Security**
   - Lock accounts after failed login attempts
   - Log all authentication events
   - Monitor for suspicious activity
   - Implement two-factor authentication (optional enhancement)

5. **API Security**
   - Use HTTPS only
   - Implement rate limiting on auth endpoints
   - Validate all inputs
   - Use CORS properly
   - Implement CSRF protection

## Testing

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      // Test implementation
    });
    
    it('should reject invalid credentials', async () => {
      // Test implementation
    });
    
    it('should lock account after 5 failed attempts', async () => {
      // Test implementation
    });
    
    it('should prevent login for locked accounts', async () => {
      // Test implementation
    });
  });
  
  describe('authorization', () => {
    it('should allow admin to access all endpoints', async () => {
      // Test implementation
    });
    
    it('should restrict agent to assigned areas', async () => {
      // Test implementation
    });
    
    it('should prevent unauthorized access', async () => {
      // Test implementation
    });
  });
});
```
