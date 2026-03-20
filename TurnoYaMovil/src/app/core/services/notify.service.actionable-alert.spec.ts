import { TestBed } from '@angular/core/testing';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { NotifyService } from './notify.service';

describe('NotifyService showActionableAlert (Task 5.3)', () => {
  let service: NotifyService;
  let mockAlertController: any;
  let acceptHandler: jasmine.Spy;
  let rejectHandler: jasmine.Spy;

  beforeEach(() => {
    acceptHandler = jasmine.createSpy('acceptHandler');
    rejectHandler = jasmine.createSpy('rejectHandler');

    // Create a simple mock that stores the config
    let savedConfig: any = null;
    
    mockAlertController = {
      create: jasmine.createSpy('create').and.callFake(async (config: any) => {
        savedConfig = config;
        return Promise.resolve({
          present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
          _config: config,
        });
      }),
      getSavedConfig: () => savedConfig,
    };

    const mockToastController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      })),
    };

    const mockModalController = {
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
    localStorage.removeItem('turnoya.notifications');
  });

  it('should create alert with correct header', async () => {
    await service.showActionableAlert(
      'Test message',
      () => {},
      () => {}
    );

    expect(mockAlertController.create).toHaveBeenCalled();
    const savedConfig = mockAlertController.getSavedConfig();
    expect(savedConfig.header).toBe('Nueva solicitud de turno');
  });

  it('should create alert with the provided message', async () => {
    const message = 'Peluquería Style — Corte clásico\n2024-01-15 10:00';

    await service.showActionableAlert(
      message,
      () => {},
      () => {}
    );

    const savedConfig = mockAlertController.getSavedConfig();
    expect(savedConfig.message).toBe(message);
  });

  it('should have Accept and Reject buttons', async () => {
    await service.showActionableAlert(
      'Test message',
      () => {},
      () => {}
    );

    const savedConfig = mockAlertController.getSavedConfig();
    const buttons: any[] = savedConfig.buttons;

    expect(buttons.length).toBe(2);
    expect(buttons[0].text).toBe('Rechazar'); // Cancel first
    expect(buttons[1].text).toBe('Aceptar'); // Confirm second
  });

  it('should call Accept handler when Accept button is tapped', async () => {
    await service.showActionableAlert(
      'Test message',
      acceptHandler,
      rejectHandler
    );

    const savedConfig = mockAlertController.getSavedConfig();
    const buttons: any[] = savedConfig.buttons;
    const acceptButton = buttons.find((b: any) => b.text === 'Aceptar');

    // Simulate button tap by calling the handler
    if (acceptButton && acceptButton.handler) {
      acceptButton.handler();
    }

    expect(acceptHandler).toHaveBeenCalledTimes(1);
    expect(rejectHandler).not.toHaveBeenCalled();
  });

  it('should call Reject handler when Reject button is tapped', async () => {
    await service.showActionableAlert(
      'Test message',
      acceptHandler,
      rejectHandler
    );

    const savedConfig = mockAlertController.getSavedConfig();
    const buttons: any[] = savedConfig.buttons;
    const rejectButton = buttons.find((b: any) => b.text === 'Rechazar');

    // Simulate button tap by calling the handler
    if (rejectButton && rejectButton.handler) {
      rejectButton.handler();
    }

    expect(rejectHandler).toHaveBeenCalledTimes(1);
    expect(acceptHandler).not.toHaveBeenCalled();
  });

  it('should have correct CSS classes on buttons', async () => {
    await service.showActionableAlert(
      'Test message',
      () => {},
      () => {}
    );

    const savedConfig = mockAlertController.getSavedConfig();
    const buttons: any[] = savedConfig.buttons;
    const acceptButton = buttons.find((b: any) => b.text === 'Aceptar');
    const rejectButton = buttons.find((b: any) => b.text === 'Rechazar');

    expect(acceptButton.cssClass).toBe('alert-btn-accept');
    expect(rejectButton.cssClass).toBe('alert-btn-reject');
  });

  it('should have correct roles on buttons', async () => {
    await service.showActionableAlert(
      'Test message',
      () => {},
      () => {}
    );

    const savedConfig = mockAlertController.getSavedConfig();
    const buttons: any[] = savedConfig.buttons;
    const acceptButton = buttons.find((b: any) => b.text === 'Aceptar');
    const rejectButton = buttons.find((b: any) => b.text === 'Rechazar');

    expect(acceptButton.role).toBe('confirm');
    expect(rejectButton.role).toBe('cancel');
  });

  it('should present the alert', async () => {
    const mockPresent = jasmine.createSpy('present').and.returnValue(Promise.resolve());
    mockAlertController.create.and.returnValue(Promise.resolve({
      present: mockPresent,
    }));

    await service.showActionableAlert(
      'Test message',
      () => {},
      () => {}
    );

    expect(mockPresent).toHaveBeenCalled();
  });

  it('should pass Accept handler as callback to button handler', async () => {
    const customAccept = jasmine.createSpy('customAccept');
    
    await service.showActionableAlert(
      'Test message',
      customAccept,
      () => {}
    );

    const savedConfig = mockAlertController.getSavedConfig();
    const buttons: any[] = savedConfig.buttons;
    const acceptButton = buttons.find((b: any) => b.text === 'Aceptar');

    if (acceptButton && acceptButton.handler) {
      acceptButton.handler();
    }

    expect(customAccept).toHaveBeenCalled();
  });
});
