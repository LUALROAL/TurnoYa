import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ApiService } from '../../../core/services/api.service';

describe('AuthService (Tasks 5.1, 5.3, 5.4)', () => {
  let service: AuthService;
  let mockSessionService: jasmine.SpyObj<AuthSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockApi: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockSessionService = jasmine.createSpyObj('AuthSessionService', [
      'setSession',
      'clearSession',
      'getSession',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockApi = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthSessionService, useValue: mockSessionService },
        { provide: Router, useValue: mockRouter },
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('getRouteByRole() - Task 5.1', () => {
    it('should return /home for Customer role', () => {
      const route = service.getRouteByRole('Customer');
      expect(route).toBe('/home');
    });

    it('should return /home for BusinessOwner role', () => {
      const route = service.getRouteByRole('BusinessOwner');
      expect(route).toBe('/home');
    });

    it('should return /professional/home for Professional role', () => {
      const route = service.getRouteByRole('Professional');
      expect(route).toBe('/professional/home');
    });

    it('should return /home for Admin role', () => {
      const route = service.getRouteByRole('Admin');
      expect(route).toBe('/home');
    });

    it('should return /home for undefined role', () => {
      const route = service.getRouteByRole(undefined);
      expect(route).toBe('/home');
    });

    it('should return /home for null role', () => {
      const route = service.getRouteByRole(null as any);
      expect(route).toBe('/home');
    });

    it('should return /home for empty string role', () => {
      const route = service.getRouteByRole('');
      expect(route).toBe('/home');
    });

    it('should return /home for unknown role', () => {
      const route = service.getRouteByRole('UnknownRole');
      expect(route).toBe('/home');
    });

    it('should return /home for lowercase role (fallback)', () => {
      const route = service.getRouteByRole('customer');
      expect(route).toBe('/home');
    });
  });

  describe('logout() - Task 5.3', () => {
    it('should call clearSession on session service', () => {
      service.logout();

      expect(mockSessionService.clearSession).toHaveBeenCalled();
    });

    it('should navigate to /auth/login', () => {
      service.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should navigate to /auth/login (full path)', () => {
      service.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        jasmine.arrayContaining(['/auth/login'])
      );
    });
  });

  describe('login() integration - Task 5.4', () => {
    const mockResponse = {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Customer',
      },
    };

    it('should call setSession with rememberMe=true to localStorage', (done) => {
      mockApi.post.and.returnValue(of(mockResponse));

      service.login('test@example.com', 'password123', true).subscribe(() => {
        expect(mockSessionService.setSession).toHaveBeenCalledWith(
          jasmine.objectContaining({
            accessToken: mockResponse.token,
            user: jasmine.objectContaining({ role: 'Customer' }),
          }),
          true // rememberMe = true
        );
        done();
      });
    });

    it('should call setSession with rememberMe=false to sessionStorage', (done) => {
      mockApi.post.and.returnValue(of(mockResponse));

      service.login('test@example.com', 'password123', false).subscribe(() => {
        expect(mockSessionService.setSession).toHaveBeenCalledWith(
          jasmine.objectContaining({
            accessToken: mockResponse.token,
          }),
          false // rememberMe = false
        );
        done();
      });
    });

    it('should default rememberMe to false when not provided', (done) => {
      mockApi.post.and.returnValue(of(mockResponse));

      service.login('test@example.com', 'password123').subscribe(() => {
        expect(mockSessionService.setSession).toHaveBeenCalledWith(
          jasmine.any(Object),
          false // default rememberMe
        );
        done();
      });
    });
  });

  describe('getRouteByRole() with different user roles - Task 5.4', () => {
    it('should route Customer to /home', () => {
      expect(service.getRouteByRole('Customer')).toBe('/home');
    });

    it('should route BusinessOwner to /home', () => {
      expect(service.getRouteByRole('BusinessOwner')).toBe('/home');
    });

    it('should route Professional to /professional/home', () => {
      expect(service.getRouteByRole('Professional')).toBe('/professional/home');
    });

    it('should route Admin to /home', () => {
      expect(service.getRouteByRole('Admin')).toBe('/home');
    });
  });
});
