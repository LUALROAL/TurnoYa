import { TestBed } from '@angular/core/testing';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { NotifyService, NotificationItem } from './notify.service';
import { AppointmentEventDto } from '../models/appointment-event.model';

describe('NotifyService Deduplication (Task 5.1)', () => {
  let service: NotifyService;
  let mockAlertController: any;
  let mockToastController: any;
  let mockModalController: any;

  const mockEvent: AppointmentEventDto = {
    appointmentId: 'apt-123',
    eventType: 'Created',
    customerId: 'cust-1',
    businessId: 'biz-1',
    businessName: 'Peluquería Style',
    serviceName: 'Corte clásico',
    scheduledDate: '2024-01-15 10:00',
    status: 'Pending',
  };

  beforeEach(() => {
    // Mock Ionic controllers
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
  });

  afterEach(() => {
    // Clean up localStorage
    localStorage.removeItem('turnoya.notifications');
  });

  it('should return false for first event (not a duplicate)', () => {
    const result = service.isDuplicate('Created', 'apt-123');
    expect(result).toBeFalse();
  });

  it('should return true for same event within 30s window (duplicate)', () => {
    // First event marks the timestamp
    service.isDuplicate('Created', 'apt-123');

    // Immediate second event should be duplicate
    const result = service.isDuplicate('Created', 'apt-123');
    expect(result).toBeTrue();
  });

  it('should return false for different event types (not duplicate)', () => {
    service.isDuplicate('Created', 'apt-123');

    // Different event type should not be duplicate
    const result = service.isDuplicate('Confirmed', 'apt-123');
    expect(result).toBeFalse();
  });

  it('should return false for different appointment IDs (not duplicate)', () => {
    service.isDuplicate('Created', 'apt-123');

    // Same event type but different ID should not be duplicate
    const result = service.isDuplicate('Created', 'apt-456');
    expect(result).toBeFalse();
  });

  it('should allow same event after 30s window passes (not duplicate)', async () => {
    // First event
    service.isDuplicate('Created', 'apt-123');

    // Simulate time passing by manipulating the Map directly
    const now = Date.now();
    const thirtyOneSecondsAgo = now - 31_000;
    (service as any).recentEvents.set('Created:apt-123', thirtyOneSecondsAgo);

    // Now should not be duplicate
    const result = service.isDuplicate('Created', 'apt-123');
    expect(result).toBeFalse();
  });

  it('should clean up old entries during deduplication check', () => {
    const now = Date.now();

    // Add an old entry that should be cleaned
    (service as any).recentEvents.set('OldEvent:apt-old', now - 60_000);

    // Add a fresh entry
    service.isDuplicate('Created', 'apt-123');

    // Old entry should be removed
    expect((service as any).recentEvents.has('OldEvent:apt-old')).toBeFalse();
  });

  it('should handle multiple different events simultaneously', () => {
    // Different events at the same time should not be duplicates
    service.isDuplicate('Created', 'apt-1');
    expect(service.isDuplicate('Created', 'apt-1')).toBeTrue(); // duplicate

    service.isDuplicate('Confirmed', 'apt-1');
    expect(service.isDuplicate('Confirmed', 'apt-1')).toBeTrue(); // duplicate

    // But different types with same ID
    expect(service.isDuplicate('Cancelled', 'apt-1')).toBeFalse(); // not duplicate
  });
});
