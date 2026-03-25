import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from './auth-session.service';
import { AuthSession } from '../models/auth-session.model';

describe('AuthSessionService (Tasks 5.2, 5.3)', () => {
  let service: AuthSessionService;
  const storageKey = 'turnoya.session';

  const mockSession: AuthSession = {
    accessToken: 'mock-access-token-12345',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Customer',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthSessionService],
    });
    service = TestBed.inject(AuthSessionService);

    // Clean up both storages before each test
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
  });

  afterEach(() => {
    // Clean up both storages after each test
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
  });

  describe('setSession() - Task 5.2', () => {
    it('should save session to sessionStorage when rememberMe is false', () => {
      service.setSession(mockSession, false);

      const stored = sessionStorage.getItem(storageKey);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).accessToken).toBe(mockSession.accessToken);

      // localStorage should be empty
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('should save session to localStorage when rememberMe is true', () => {
      service.setSession(mockSession, true);

      const stored = localStorage.getItem(storageKey);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).accessToken).toBe(mockSession.accessToken);

      // sessionStorage should be empty
      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });

    it('should default to sessionStorage when rememberMe is not provided', () => {
      service.setSession(mockSession);

      const stored = sessionStorage.getItem(storageKey);
      expect(stored).toBeTruthy();
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('should emit session through session$ observable', (done) => {
      service.setSession(mockSession, false);

      service.session$.subscribe((session) => {
        expect(session).toBeTruthy();
        expect(session?.accessToken).toBe(mockSession.accessToken);
        done();
      });
    });

    it('should overwrite previous session in the same storage', () => {
      const session1: AuthSession = { ...mockSession, accessToken: 'token-1' };
      const session2: AuthSession = { ...mockSession, accessToken: 'token-2' };

      service.setSession(session1, false);
      service.setSession(session2, false);

      const stored = sessionStorage.getItem(storageKey);
      expect(JSON.parse(stored!).accessToken).toBe('token-2');
    });
  });

  describe('clearSession() - Task 5.3', () => {
    it('should clear session from localStorage', () => {
      localStorage.setItem(storageKey, JSON.stringify(mockSession));

      service.clearSession();

      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('should clear session from sessionStorage', () => {
      sessionStorage.setItem(storageKey, JSON.stringify(mockSession));

      service.clearSession();

      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });

    it('should clear session from both storages regardless of where it was saved', () => {
      // Save in localStorage
      localStorage.setItem(storageKey, JSON.stringify(mockSession));
      // Also put something in sessionStorage (edge case)
      sessionStorage.setItem(storageKey, JSON.stringify(mockSession));

      service.clearSession();

      expect(localStorage.getItem(storageKey)).toBeNull();
      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });

    it('should emit null through session$ observable after clearing', (done) => {
      service.setSession(mockSession, false);

      service.clearSession();

      service.session$.subscribe((session) => {
        expect(session).toBeNull();
        done();
      });
    });

    it('should handle clearing when no session exists', () => {
      expect(() => {
        service.clearSession();
      }).not.toThrow();
    });
  });

  describe('getSession()', () => {
    it('should return session from localStorage when loaded at initialization', () => {
      // Set localStorage BEFORE service is created
      localStorage.setItem(storageKey, JSON.stringify(mockSession));

      // Create a new service instance (it will load from localStorage in constructor)
      const newService = new AuthSessionService();

      const session = newService.getSession();

      expect(session).toBeTruthy();
      expect(session?.accessToken).toBe(mockSession.accessToken);
    });

    it('should return session that was set via setSession', () => {
      service.setSession(mockSession, false);

      const session = service.getSession();

      expect(session).toBeTruthy();
      expect(session?.accessToken).toBe(mockSession.accessToken);
    });

    it('should return null when no session exists', () => {
      const session = service.getSession();
      expect(session).toBeNull();
    });

    it('should return the session set via setSession regardless of initial storage', () => {
      // Set localStorage with different token
      localStorage.setItem(storageKey, JSON.stringify({ ...mockSession, accessToken: 'initial-token' }));

      // Create a new service (loads initial token)
      const newService = new AuthSessionService();

      // Now set a new session
      const newSession: AuthSession = { ...mockSession, accessToken: 'new-token' };
      newService.setSession(newSession, false);

      // getSession should return the newly set session
      const session = newService.getSession();
      expect(session?.accessToken).toBe('new-token');
    });
  });

  describe('getAccessToken()', () => {
    it('should return access token from session', () => {
      service.setSession(mockSession, false);

      const token = service.getAccessToken();

      expect(token).toBe(mockSession.accessToken);
    });

    it('should return null when no session exists', () => {
      const token = service.getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe('hasValidSession()', () => {
    it('should return true when token is not expired', () => {
      const validSession: AuthSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };
      service.setSession(validSession, false);

      expect(service.hasValidSession()).toBeTrue();
    });

    it('should return false when token is expired', () => {
      const expiredSession: AuthSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      service.setSession(expiredSession, false);

      expect(service.hasValidSession()).toBeFalse();
    });

    it('should return false when no session exists', () => {
      expect(service.hasValidSession()).toBeFalse();
    });
  });
});
