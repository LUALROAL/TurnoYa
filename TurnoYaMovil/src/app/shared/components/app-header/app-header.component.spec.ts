import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppHeaderComponent } from './app-header.component';
import { NotifyService } from '../../../core/services/notify.service';
import { BehaviorSubject } from 'rxjs';
import { addIcons } from 'ionicons';
import { notificationsOutline, notifications } from 'ionicons/icons';

describe('AppHeaderComponent (Task 5.4)', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;
  let mockNotifyService: any;
  let unreadCountSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    unreadCountSubject = new BehaviorSubject<number>(0);

    mockNotifyService = {
      openNotificationCenter: jasmine.createSpy('openNotificationCenter').and.returnValue(Promise.resolve()),
      unreadCount$: unreadCountSubject.asObservable(),
    };

    // Initialize icons
    addIcons({
      notificationsOutline,
      notifications,
    });

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        { provide: NotifyService, useValue: mockNotifyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('turnoya.notifications');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('badge display', () => {
    it('should not show badge when count is 0', () => {
      unreadCountSubject.next(0);
      fixture.detectChanges();

      // Badge span should not exist when count is 0
      const spans = fixture.debugElement.queryAll(By.css('span'));
      const badgeSpan = spans.find(span => 
        span.nativeElement.classList.contains('bg-neon-primary')
      );
      expect(badgeSpan).toBeFalsy();
    });

    it('should show badge when count is greater than 0', () => {
      unreadCountSubject.next(5);
      fixture.detectChanges();

      const spans = fixture.debugElement.queryAll(By.css('span'));
      const badgeSpan = spans.find(span => 
        span.nativeElement.classList.contains('bg-neon-primary')
      );
      expect(badgeSpan).toBeTruthy();
      const badgeSpan5 = badgeSpan as any;
      expect(badgeSpan5.nativeElement.textContent.trim()).toBe('5');
    });

    it('should show 99+ when count exceeds 99', () => {
      unreadCountSubject.next(150);
      fixture.detectChanges();

      const spans = fixture.debugElement.queryAll(By.css('span'));
      const badgeSpan = spans.find(span => 
        span.nativeElement.classList.contains('bg-neon-primary')
      );
      expect(badgeSpan).toBeTruthy();
      const badgeSpan150 = badgeSpan as any;
      expect(badgeSpan150.nativeElement.textContent.trim()).toBe('99+');
    });

    it('should update badge when count changes', () => {
      unreadCountSubject.next(1);
      fixture.detectChanges();

      let spans = fixture.debugElement.queryAll(By.css('span'));
      let badgeSpan = spans.find(span => span.nativeElement.classList.contains('bg-neon-primary'));
      expect(badgeSpan && badgeSpan.nativeElement.textContent.trim()).toBe('1');

      unreadCountSubject.next(10);
      fixture.detectChanges();

      spans = fixture.debugElement.queryAll(By.css('span'));
      badgeSpan = spans.find(span => span.nativeElement.classList.contains('bg-neon-primary'));
      expect(badgeSpan && badgeSpan.nativeElement.textContent.trim()).toBe('10');

      unreadCountSubject.next(0);
      fixture.detectChanges();

      spans = fixture.debugElement.queryAll(By.css('span'));
      badgeSpan = spans.find(span => span.nativeElement.classList.contains('bg-neon-primary'));
      expect(badgeSpan).toBeFalsy();
    });

    it('should display correct count for various values', () => {
      const testCases = [1, 2, 5, 10, 50, 99];
      
      testCases.forEach(count => {
        unreadCountSubject.next(count);
        fixture.detectChanges();
        
        const spans = fixture.debugElement.queryAll(By.css('span'));
        const badgeSpan = spans.find(span => span.nativeElement.classList.contains('bg-neon-primary'));
        expect(badgeSpan?.nativeElement.textContent.trim()).toBe(count.toString());
      });
    });
  });

  describe('bell icon', () => {
    it('should render ion-icon element', () => {
      const icon = fixture.debugElement.query(By.css('ion-icon'));
      expect(icon).toBeTruthy();
    });

    it('should have icon for notification bell', () => {
      const icon = fixture.debugElement.query(By.css('ion-icon'));
      expect(icon.nativeElement.getAttribute('name')).toBeTruthy();
    });
  });

  describe('click interaction', () => {
    it('should call openNotificationCenter when bell is clicked', async () => {
      const button = fixture.debugElement.query(By.css('button'));
      await button.nativeElement.click();

      expect(mockNotifyService.openNotificationCenter).toHaveBeenCalledTimes(1);
    });

    it('should be a button element with correct aria-label', () => {
      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe(
        'Abrir centro de notificaciones'
      );
    });
  });
});
