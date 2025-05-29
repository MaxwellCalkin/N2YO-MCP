import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface UDLCredentials {
  username: string;
  password: string;
  classification: "unclassified" | "cui" | "secret";
  apiEndpoint?: string;
}

export interface StoredCredentials {
  username: string;
  passwordHash: string;
  salt: string;
  classification: "unclassified" | "cui" | "secret";
  apiEndpoint?: string;
  createdAt: string;
  lastUsed?: string;
}

export interface AuthSession {
  sessionId: string;
  username: string;
  classification: "unclassified" | "cui" | "secret";
  accessToken?: string;
  refreshToken?: string;
  expiresAt: string;
  permissions: string[];
}

export interface AuthenticationStatus {
  isAuthenticated: boolean;
  username?: string;
  classification?: string;
  sessionId?: string;
  expiresAt?: string;
  permissions?: string[];
  lastActivity?: string;
}

export class UDLAuthenticator {
  private credentialsDir: string;
  private sessions: Map<string, AuthSession> = new Map();
  private currentSession?: AuthSession;

  constructor(credentialsDir?: string) {
    this.credentialsDir = credentialsDir || join(homedir(), ".udl-credentials");
  }

  private async ensureCredentialsDir(): Promise<void> {
    try {
      await fs.mkdir(this.credentialsDir, { recursive: true, mode: 0o700 });
    } catch (error) {
      throw new Error(`Failed to create credentials directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async hashPassword(password: string, salt?: Buffer): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || randomBytes(32);
    const hash = await scryptAsync(password, passwordSalt, 64) as Buffer;
    return {
      hash: hash.toString('hex'),
      salt: passwordSalt.toString('hex')
    };
  }

  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const saltBuffer = Buffer.from(salt, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const inputHash = await scryptAsync(password, saltBuffer, 64) as Buffer;
    return timingSafeEqual(hashBuffer, inputHash);
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  private generateApiToken(): string {
    return randomBytes(48).toString('base64url');
  }

  async storeCredentials(credentials: UDLCredentials): Promise<void> {
    await this.ensureCredentialsDir();

    const { hash, salt } = await this.hashPassword(credentials.password);
    
    const stored: StoredCredentials = {
      username: credentials.username,
      passwordHash: hash,
      salt,
      classification: credentials.classification,
      apiEndpoint: credentials.apiEndpoint || 'https://unifieddatalibrary.com/api',
      createdAt: new Date().toISOString(),
    };

    const credentialsFile = join(this.credentialsDir, 'credentials.json');
    try {
      await fs.writeFile(credentialsFile, JSON.stringify(stored, null, 2), { mode: 0o600 });
    } catch (error) {
      throw new Error(`Failed to store credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadCredentials(): Promise<StoredCredentials | null> {
    try {
      const credentialsFile = join(this.credentialsDir, 'credentials.json');
      const content = await fs.readFile(credentialsFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to load credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async authenticateUser(username: string, password: string): Promise<AuthSession> {
    const stored = await this.loadCredentials();
    
    if (!stored) {
      throw new Error('No stored credentials found. Please configure UDL credentials first.');
    }

    if (stored.username !== username) {
      throw new Error('Invalid username');
    }

    const isValidPassword = await this.verifyPassword(password, stored.passwordHash, stored.salt);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Simulate API authentication call to UDL
    const authResult = await this.authenticateWithUDL(username, password, stored);

    const sessionId = this.generateSessionId();
    const session: AuthSession = {
      sessionId,
      username,
      classification: stored.classification,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      permissions: authResult.permissions,
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;

    // Update last used timestamp
    stored.lastUsed = new Date().toISOString();
    const credentialsFile = join(this.credentialsDir, 'credentials.json');
    await fs.writeFile(credentialsFile, JSON.stringify(stored, null, 2), { mode: 0o600 });

    return session;
  }

  private async authenticateWithUDL(username: string, password: string, stored: StoredCredentials): Promise<{
    accessToken: string;
    refreshToken: string;
    permissions: string[];
  }> {
    // This would make an actual API call to the UDL authentication endpoint
    // For now, we'll simulate the authentication process
    
    const apiEndpoint = stored.apiEndpoint || 'https://unifieddatalibrary.com/api';
    
    try {
      // Simulated API call - in reality this would be:
      // const response = await fetch(`${apiEndpoint}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password, classification: stored.classification })
      // });
      
      // For demonstration, generate mock tokens and permissions
      const permissions = this.getPermissionsForClassification(stored.classification);
      
      return {
        accessToken: this.generateApiToken(),
        refreshToken: this.generateApiToken(),
        permissions,
      };
    } catch (error) {
      throw new Error(`UDL API authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getPermissionsForClassification(classification: string): string[] {
    const basePermissions = [
      'catalog:read',
      'objects:search',
      'objects:get',
      'tle:read',
    ];

    switch (classification) {
      case 'unclassified':
        return [
          ...basePermissions,
          'predictions:read',
        ];
      
      case 'cui':
        return [
          ...basePermissions,
          'predictions:read',
          'conjunctions:read',
          'sensors:read',
          'analysis:read',
        ];
      
      case 'secret':
        return [
          ...basePermissions,
          'predictions:read',
          'conjunctions:read',
          'sensors:read',
          'analysis:read',
          'classifications:all',
          'spacefence:read',
          'intelligence:read',
        ];
      
      default:
        return basePermissions;
    }
  }

  async refreshSession(sessionId: string): Promise<AuthSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(sessionId);
      throw new Error('Session expired');
    }

    // Simulate token refresh with UDL API
    const newAccessToken = this.generateApiToken();
    const refreshedSession: AuthSession = {
      ...session,
      accessToken: newAccessToken,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };

    this.sessions.set(sessionId, refreshedSession);
    if (this.currentSession?.sessionId === sessionId) {
      this.currentSession = refreshedSession;
    }

    return refreshedSession;
  }

  async logout(sessionId?: string): Promise<void> {
    const targetSessionId = sessionId || this.currentSession?.sessionId;
    
    if (targetSessionId) {
      const session = this.sessions.get(targetSessionId);
      if (session) {
        // Notify UDL API about logout (revoke tokens)
        await this.revokeTokensWithUDL(session);
        this.sessions.delete(targetSessionId);
      }
    }

    if (!sessionId || this.currentSession?.sessionId === sessionId) {
      this.currentSession = undefined;
    }
  }

  private async revokeTokensWithUDL(session: AuthSession): Promise<void> {
    // This would make an API call to revoke the tokens
    // For simulation purposes, we'll just log it
    console.log(`Revoking tokens for session ${session.sessionId}`);
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (!this.currentSession) {
      return null;
    }

    // Check if session is still valid
    if (new Date() > new Date(this.currentSession.expiresAt)) {
      await this.logout(this.currentSession.sessionId);
      return null;
    }

    return this.currentSession;
  }

  async getAuthenticationStatus(): Promise<AuthenticationStatus> {
    const session = await this.getCurrentSession();
    
    if (!session) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      username: session.username,
      classification: session.classification,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      permissions: session.permissions,
      lastActivity: new Date().toISOString(),
    };
  }

  async validatePermission(permission: string): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session) {
      return false;
    }

    return session.permissions.includes(permission) || 
           session.permissions.includes('*') ||
           session.permissions.includes(permission.split(':')[0] + ':*');
  }

  async getApiHeaders(): Promise<Record<string, string>> {
    const session = await this.getCurrentSession();
    if (!session || !session.accessToken) {
      throw new Error('Not authenticated');
    }

    return {
      'Authorization': `Bearer ${session.accessToken}`,
      'X-Classification': session.classification.toUpperCase(),
      'X-Session-ID': session.sessionId,
      'Content-Type': 'application/json',
      'User-Agent': 'UDL-MCP-Server/1.0.0',
    };
  }

  async clearStoredCredentials(): Promise<void> {
    try {
      const credentialsFile = join(this.credentialsDir, 'credentials.json');
      await fs.unlink(credentialsFile);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to clear credentials: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}