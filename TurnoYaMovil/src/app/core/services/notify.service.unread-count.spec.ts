import { TestBed } from '@angular/core/testing';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { NotifyService, NotificationItem } from './notify.service';

describe('NotifyService UnreadCount (Task 5.2)', () => {
  let service: NotifyService;
  let mockAlertController: any;
  let mockToastController: any;
  let mockModalController: any;

  beforeEach(() => {
    mockAlertController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      })),
    };

    mockToastController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      })),
    };

    mockModalController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
        onDidDismiss: jasmine.createSpy('onDidDismiss').and.returnValue(Promise.resolve({})),
        dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve()),
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        NotifyService,
        { provide: AlertController, useValue: mockAlertController },
        { provide: ToastController, useValue: mockToastController },
        { provide: ModalController, useValue: mockModalController },
      ],
    });

    service = TestBed.inject(NotifyService);

    // Clear localStorage before each test
    localStorage.removeItem('turnoya.notifications');
  });

  afterEach(() => {
    localStorage.removeItem('turnoya.notifications');
  });

  describe('initial state', () => {
    it('should initialize with 0 unread notifications', () => {
      expect(service.unreadCount$.value).toBe(0);
    });

    it('should emit initial 0 value', (done) => {
      service.unreadCount$.subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('saveToHistory() increments count', () => {
    it('should increment unread count when saving unread notification', () => {
      const item: NotificationItem = createMockNotification('apt-1', false);
      service.saveToHistory(item);
      expect(service.unreadCount$.value).toBe(1);
    });

    it('should not increment count when saving read notification', () => {
      const item: NotificationItem = createMockNotification('apt-1', true);
      service.saveToHistory(item);
      expect(service.unreadCount$.value).toBe(0);
    });

    it('should increment by 1 for each unread notification', () => {
      service.saveToHistory(createMockNotification('apt-1', false));
      expect(service.unreadCount$.value).toBe(1);

      service.saveToHistory(createMockNotification('apt-2', false));
      expect(service.unreadCount$.value).toBe(2);

      service.saveToHistory(createMockNotification('apt-3', false));
      expect(service.unreadCount$.value).toBe(3);
    });

    it('should persist to localStorage', () => {
      service.saveToHistory(createMockNotification('apt-1', false));

      const stored = localStorage.getItem('turnoya.notifications');
      expect(stored).toBeTruthy();

      const items: NotificationItem[] = JSON.parse(stored!);
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('apt-1');
    });
  });

  describe('markAsRead() decrements count', () => {
    it('should decrement count when marking unread notification as read', () => {
      service.saveToHistory(createMockNotification('apt-1', false));
      service.saveToHistory(createMockNotification('apt-2', false));
      expect(service.unreadCount$.value).toBe(2);

      service.markAsRead('apt-1');
      expect(service.unreadCount$.value).toBe(1);
    });

    it('should not decrement below 0', () => {
      service.saveToHistory(createMockNotification('apt-1', false));
      expect(service.unreadCount$.value).toBe(1);

      // Mark as read twice should not go below 0
      service.markAsRead('apt-1');
      expect(service.unreadCount$.value).toBe(0);

      service.markAsRead('apt-1');
      expect(service.unreadCount$.value).toBe(0);
    });

    it('should not decrement for already-read notification', () => {
      service.saveToHistory(createMockNotification('apt-1', true)); // read
      expect(service.unreadCount$.value).toBe(0);

      service.markAsRead('apt-1');
      expect(service.unreadCount$.value).toBe(0); // Still 0
    });
  });

  describe('clearAll() resets count', () => {
    it('should reset count to 0', () => {
      service.saveToHistory(createMockNotification('apt-1', false));
      service.saveToHistory(createMockNotification('apt-2', false));
      service.saveToHistory(createMockNotification('apt-3', false));
      expect(service.unreadCount$.value).toBe(3);

      service.clearAll();
      expect(service.unreadCount$.value).toBe(0);
    });

    it('should clear localStorage', () => {
      service.saveToHistory(createMockNotification('apt-1', false));
      expect(localStorage.getItem('turnoya.notifications')).toBeTruthy();

      service.clearAll();
      expect(localStorage.getItem('turnoya.notifications')).toBeNull();
    });
  });

  describe('persistence across reload', () => {
    it('should restore count from localStorage on service init', () => {
      // Pre-populate localStorage with 2 unread notifications
      const items: NotificationItem[] = [
        createMockNotification('apt-1', false),
        createMockNotification('apt-2', false),
        createMockNotification('apt-3', true), // read - should not count
      ];
      localStorage.setItem('turnoya.notifications', JSON.stringify(items));

      // Call restoreFromStorage directly (simulates what constructor does)
      (service as any).restoreFromStorage();

      expect(service.unreadCount$.value).toBe(2); // Only 2 unread
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('turnoya.notifications', 'invalid-json');

      // Should not throw, just continue with current count
      expect(() => (service as any).restoreFromStorage()).not.toThrow();
    });
  });

  describe('getHistory() returns stored notifications', () => {
    it('should return empty array when no notifications stored', () => {
      const history = service.getHistory();
      expect(history).toEqual([]);
    });

    it('should return stored notifications', () => {
      service.saveToHistory(createMockNotification('apt-1', false));
      service.saveToHistory(createMockNotification('apt-2', true));

      const history = service.getHistory();
      expect(history.length).toBe(2);
    });
  });
});

// Helper function to create mock notifications
function createMockNotification(id: string, read: boolean): NotificationItem {
  return {
    id,
    eventType: 'Created',
    title: 'Nueva solicitud de turno',
    body: 'Peluquería Style — Corte clásico',
    businessName: 'Peluquería Style',
    serviceName: 'Corte clásico',
    scheduledDate: '2024-01-15 10:00',
    read,
    timestamp: Date.now(),
  };
}
