import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NotificationCenterComponent } from './notification-center.component';
import { NotifyService, NotificationItem } from '../../../core/services/notify.service';
import { Subject } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  trashOutline, 
  closeOutline, 
  checkmarkCircle, 
  timeOutline, 
  alertCircle 
} from 'ionicons/icons';

describe('NotificationCenterComponent (Task 5.5)', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let mockNotifyService: any;
  let notificationCenterRequestedSubject: Subject<void>;

  const mockNotifications: NotificationItem[] = [
    {
      id: 'apt-1',
      eventType: 'Created',
      title: 'Nueva solicitud de turno',
      body: 'Peluquería Style — Corte clásico',
      businessName: 'Peluquería Style',
      serviceName: 'Corte clásico',
      scheduledDate: '2024-01-15 10:00',
      read: false,
      timestamp: Date.now(),
    },
    {
      id: 'apt-2',
      eventType: 'Confirmed',
      title: 'Turno confirmado',
      body: 'Barbería El Rey — Barba',
      businessName: 'Barbería El Rey',
      serviceName: 'Barba',
      scheduledDate: '2024-01-16 14:00',
      read: true,
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'apt-3',
      eventType: 'Cancelled',
      title: 'Turno cancelado',
      body: 'Spa Relax — Masaje',
      businessName: 'Spa Relax',
      serviceName: 'Masaje',
      scheduledDate: '2024-01-17 11:00',
      read: false,
      timestamp: Date.now() - 7200000,
    },
  ];

  beforeEach(async () => {
    notificationCenterRequestedSubject = new Subject<void>();

    mockNotifyService = {
      getHistory: jasmine.createSpy('getHistory').and.returnValue([]),
      markAsRead: jasmine.createSpy('markAsRead'),
      clearAll: jasmine.createSpy('clearAll'),
      closeModal: jasmine.createSpy('closeModal'),
      notificationCenterRequested$: notificationCenterRequestedSubject.asObservable(),
    };

    // Initialize icons
    addIcons({
      trashOutline,
      closeOutline,
      checkmarkCircle,
      timeOutline,
      alertCircle,
    });

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        { provide: NotifyService, useValue: mockNotifyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('turnoya.notifications');
    notificationCenterRequestedSubject.complete();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('empty state', () => {
    it('should show empty state when there are no notifications', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([]);

      fixture.detectChanges();
      tick(200); // Wait for loadHistory timeout

      expect(component.isEmpty).toBeTrue();

      const emptyState = fixture.debugElement.query(By.css('h3'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('Sin notificaciones');
    }));

    it('should not show notification list when empty', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([]);

      fixture.detectChanges();
      tick(200);

      const list = fixture.debugElement.query(By.css('.notification-list'));
      expect(list).toBeFalsy();
    }));

    it('should hide clear button when empty', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([]);

      fixture.detectChanges();
      tick(200);

      const clearButton = fixture.debugElement.query(
        By.css('ion-button[aria-label="Limpiar todas las notificaciones"]')
      );
      expect(clearButton).toBeFalsy();
    }));
  });

  describe('notification list', () => {
    it('should display all notifications from history', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const items = fixture.debugElement.queryAll(By.css('.notification-item'));
      expect(items.length).toBe(3);
    }));

    it('should show notifications sorted newest-first', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const items = fixture.debugElement.queryAll(By.css('.notification-item'));
      // First item should be apt-1 (most recent)
      const firstTitle = items[0].query(By.css('h4')).nativeElement.textContent;
      expect(firstTitle).toContain('Nueva solicitud');
    }));

    it('should display notification title', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[0]]);

      fixture.detectChanges();
      tick(200);

      const title = fixture.debugElement.query(By.css('h4')).nativeElement;
      expect(title.textContent).toContain('Nueva solicitud de turno');
    }));

    it('should display notification body', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[0]]);

      fixture.detectChanges();
      tick(200);

      const body = fixture.debugElement.query(By.css('p')).nativeElement;
      expect(body.textContent).toContain('Peluquería Style — Corte clásico');
    }));

    it('should display scheduled date', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[0]]);

      fixture.detectChanges();
      tick(200);

      const date = fixture.debugElement.query(By.css('.text-xs')).nativeElement;
      expect(date.textContent).toContain('2024-01-15 10:00');
    }));

    it('should show unread indicator for unread notifications', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[0]]); // unread

      fixture.detectChanges();
      tick(200);

      const unreadDot = fixture.debugElement.query(By.css('.unread-dot'));
      expect(unreadDot).toBeTruthy();

      const item = fixture.debugElement.query(By.css('.notification-item'));
      expect(item.nativeElement.classList.contains('unread')).toBeTrue();
    }));

    it('should not show unread indicator for read notifications', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[1]]); // read

      fixture.detectChanges();
      tick(200);

      const unreadDot = fixture.debugElement.query(By.css('.unread-dot'));
      expect(unreadDot).toBeFalsy();
    }));
  });

  describe('mark as read on tap', () => {
    it('should call markAsRead when tapping unread notification', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const firstItem = fixture.debugElement.query(By.css('.notification-item'));
      firstItem.nativeElement.click();

      expect(mockNotifyService.markAsRead).toHaveBeenCalledWith('apt-1');
    }));

    it('should not call markAsRead for already-read notification', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[1]]); // read

      fixture.detectChanges();
      tick(200);

      const item = fixture.debugElement.query(By.css('.notification-item'));
      item.nativeElement.click();

      expect(mockNotifyService.markAsRead).not.toHaveBeenCalled();
    }));

    it('should handle keyboard events (Enter)', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const firstItem = fixture.debugElement.query(By.css('.notification-item'));
      firstItem.triggerEventHandler('keydown.enter', null);

      expect(mockNotifyService.markAsRead).toHaveBeenCalledWith('apt-1');
    }));

    it('should handle keyboard events (Space)', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const firstItem = fixture.debugElement.query(By.css('.notification-item'));
      firstItem.triggerEventHandler('keydown.space', null);

      expect(mockNotifyService.markAsRead).toHaveBeenCalledWith('apt-1');
    }));
  });

  describe('clear all functionality', () => {
    it('should show clear button when there are notifications', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const clearButton = fixture.debugElement.query(
        By.css('ion-button[aria-label="Limpiar todas las notificaciones"]')
      );
      expect(clearButton).toBeTruthy();
    }));

    it('should call clearAll when clear button is clicked', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const clearButton = fixture.debugElement.query(
        By.css('ion-button[aria-label="Limpiar todas las notificaciones"]')
      );
      clearButton.nativeElement.click();

      expect(mockNotifyService.clearAll).toHaveBeenCalled();
    }));
  });

  describe('close functionality', () => {
    it('should call closeModal when close button is clicked', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);

      fixture.detectChanges();
      tick(200);

      const closeButton = fixture.debugElement.query(
        By.css('ion-button[aria-label="Cerrar"]')
      );
      closeButton.nativeElement.click();

      expect(mockNotifyService.closeModal).toHaveBeenCalled();
    }));
  });

  describe('event type badges', () => {
    it('should display correct label for Created event', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[0]]);

      fixture.detectChanges();
      tick(200);

      // Find the badge by looking for text containing event type label
      const allSpans = fixture.debugElement.queryAll(By.css('span'));
      const badge = allSpans.find(span => span.nativeElement.textContent.includes('Solicitud'));
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge.nativeElement.textContent).toContain('Solicitud');
      }
    }));

    it('should display correct label for Confirmed event', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[1]]);

      fixture.detectChanges();
      tick(200);

      const allSpans = fixture.debugElement.queryAll(By.css('span'));
      const badge = allSpans.find(span => span.nativeElement.textContent.includes('Confirmado'));
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge.nativeElement.textContent).toContain('Confirmado');
      }
    }));

    it('should display correct label for Cancelled event', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[2]]);

      fixture.detectChanges();
      tick(200);

      const allSpans = fixture.debugElement.queryAll(By.css('span'));
      const badge = allSpans.find(span => span.nativeElement.textContent.includes('Cancelado'));
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge.nativeElement.textContent).toContain('Cancelado');
      }
    }));
  });

  describe('loading state', () => {
    it('should show spinner while loading', () => {
      // Set loading via component's private property
      (component as any).isLoading = true;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should not show list while loading', () => {
      (component as any).isLoading = true;
      fixture.detectChanges();

      const list = fixture.debugElement.query(By.css('.notification-list'));
      expect(list).toBeFalsy();
    });
  });

  describe('hasUnread computed property', () => {
    it('should return true when there are unread notifications', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[0]]);

      fixture.detectChanges();
      tick(200);

      expect(component.hasUnread).toBeTrue();
    }));

    it('should return false when all notifications are read', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([mockNotifications[1]]); // read

      fixture.detectChanges();
      tick(200);

      expect(component.hasUnread).toBeFalse();
    }));
  });

  describe('clearAll method', () => {
    it('should clear notifications array after clearAll', fakeAsync(() => {
      mockNotifyService.getHistory.and.returnValue([...mockNotifications]);
      mockNotifyService.clearAll.and.callFake(() => {
        (component as any).notifications = [];
      });

      fixture.detectChanges();
      tick(200);

      component.clearAll();
      fixture.detectChanges();

      expect((component as any).notifications.length).toBe(0);
    }));
  });

  describe('close method', () => {
    it('should call notifyService.closeModal', () => {
      component.close();
      expect(mockNotifyService.closeModal).toHaveBeenCalled();
    });
  });
});
