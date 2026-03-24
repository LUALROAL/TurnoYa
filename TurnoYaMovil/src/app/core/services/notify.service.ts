import { Injectable, inject } from "@angular/core";
import { AlertController, ToastController, ModalController } from "@ionic/angular";
import { BehaviorSubject, Subject } from "rxjs";
import { addIcons } from "ionicons";
import { warningOutline, checkmarkCircleOutline, informationCircleOutline } from "ionicons/icons";
import { AppointmentEventDto } from '../models/appointment-event.model';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';

/**
 * Represents a notification item stored in localStorage.
 */
export interface NotificationItem {
  id: string;           // appointmentId
  eventType: 'Created' | 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow';
  title: string;        // e.g. "Nueva solicitud de turno"
  body: string;         // e.g. "Peluquería Style — Corte clásico"
  businessName: string;
  serviceName: string;
  scheduledDate: string;
  read: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'turnoya.notifications';
const DEDUP_WINDOW_MS = 30_000; // 30 seconds

@Injectable({
  providedIn: "root",
})
export class NotifyService {
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);

  /** Reference to the currently open notification center modal */
  private activeModal: HTMLIonModalElement | null = null;

  /** Emitted when notification center should open */
  readonly notificationCenterRequested$ = new Subject<void>();

  /** Unread notification count — used by AppHeaderComponent badge */
  readonly unreadCount$ = new BehaviorSubject<number>(0);

  /** Map for 30s deduplication window: eventKey -> timestamp */
  private readonly recentEvents = new Map<string, number>();

  constructor() {
    addIcons({ warningOutline, checkmarkCircleOutline, informationCircleOutline });
    this.restoreFromStorage();
  }

  // ==========================================================================
  // Toast Notifications (existing API)
  // ==========================================================================

  async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: "bottom",
      color: "danger",
      icon: "warning-outline",
      cssClass: "toast-neon toast-neon-danger",
    });

    await toast.present();
  }

  async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      position: "bottom",
      color: "success",
      icon: "checkmark-circle-outline",
      cssClass: "toast-neon toast-neon-success",
    });

    await toast.present();
  }

  // ==========================================================================
  // Notification Center (Phase 1 - skeleton)
  // ==========================================================================

  /**
   * Task 3.4: Opens the notification center modal.
   * Uses ModalController to present NotificationCenterComponent.
   */
  async openNotificationCenter(): Promise<void> {
    // Don't open if a modal is already active
    if (this.activeModal) {
      return;
    }

    const modal = await this.modalController.create({
      component: NotificationCenterComponent,
      componentProps: {
        // Pass any initial data here if needed
      },
      breakpoints: [0, 0.75, 1], // Modal height options: 0%, 75%, 100%
      initialBreakpoint: 0.75,    // Start at 75% height
      handle: true,              // Show drag handle
      backdropDismiss: true,      // Allow closing by tapping backdrop
      cssClass: 'notification-center-modal',
    });

    this.activeModal = modal;

    // Clear reference when modal is dismissed
    modal.onDidDismiss().then(() => {
      this.activeModal = null;
    });

    await modal.present();
    console.debug('[NotifyService] Notification center modal opened');
  }

  /**
   * Task 3.4: Closes the notification center modal if open.
   */
  async closeModal(): Promise<void> {
    if (this.activeModal) {
      await this.activeModal.dismiss();
      this.activeModal = null;
      console.debug('[NotifyService] Notification center modal closed');
    }
  }

  // ==========================================================================
  // History Management (Phase 1 - foundation for Phase 2)
  // ==========================================================================

  /**
   * Restores notification count from localStorage on service init.
   */
  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: NotificationItem[] = JSON.parse(stored);
        const unreadCount = items.filter((i) => !i.read).length;
        this.unreadCount$.next(unreadCount);
      }
    } catch (error) {
      console.warn('[NotifyService] Failed to restore from localStorage:', error);
      // Continue with count = 0
    }
  }

  /**
   * Saves a notification item to localStorage and increments unread count.
   * Called by handleAppointmentEvent in Phase 2.
   */
  saveToHistory(item: NotificationItem): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: NotificationItem[] = stored ? JSON.parse(stored) : [];

      items.unshift(item); // Add to beginning (newest first)

      // Limit to last 50 items to prevent quota issues
      const trimmed = items.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

      if (!item.read) {
        this.unreadCount$.next(this.unreadCount$.value + 1);
      }
    } catch (error) {
      console.warn('[NotifyService] Failed to save to localStorage:', error);
      // Still update in-memory count if localStorage fails
      if (!item.read) {
        this.unreadCount$.next(this.unreadCount$.value + 1);
      }
    }
  }

  /**
   * Gets all notifications from localStorage.
   */
  getHistory(): NotificationItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('[NotifyService] Failed to get history:', error);
      return [];
    }
  }

  /**
   * Marks a notification as read and decrements unread count.
   */
  markAsRead(id: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const items: NotificationItem[] = JSON.parse(stored);
      const index = items.findIndex((i) => i.id === id);

      if (index !== -1 && !items[index].read) {
        items[index].read = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        this.unreadCount$.next(Math.max(0, this.unreadCount$.value - 1));
      }
    } catch (error) {
      console.warn('[NotifyService] Failed to mark as read:', error);
    }
  }

  /**
   * Clears all notifications and resets unread count.
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.unreadCount$.next(0);
    } catch (error) {
      console.warn('[NotifyService] Failed to clear all:', error);
    }
  }

  // ==========================================================================
  // Deduplication (Phase 1 - foundation for Phase 2)
  // ==========================================================================

  /**
   * Checks if an event is a duplicate within the 30s window.
   * Returns true if the event should be dropped.
   */
  isDuplicate(eventType: string, appointmentId: string): boolean {
    const key = `${eventType}:${appointmentId}`;
    const now = Date.now();
    const lastSeen = this.recentEvents.get(key);

    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      return true; // Duplicate
    }

    this.recentEvents.set(key, now);

    // Cleanup old entries to prevent memory leaks
    for (const [k, timestamp] of this.recentEvents.entries()) {
      if (now - timestamp >= DEDUP_WINDOW_MS) {
        this.recentEvents.delete(k);
      }
    }

    return false;
  }

  // ==========================================================================
  // Visibility Check (Phase 1 - foundation for Phase 2)
  // ==========================================================================

  /**
   * Returns true if the app was visible when the event arrived.
   * Used to determine whether to show toast or just update badge.
   */
  wasAppVisible(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'visible';
  }

  // ==========================================================================
  // Phase 2: Core NotifyService Logic — Toast + Alert orchestration
  // ==========================================================================

  /**
   * Builds a NotificationItem from an AppointmentEventDto.
   */
  private buildNotificationItem(event: AppointmentEventDto): NotificationItem {
    const titles: Record<AppointmentEventDto['eventType'], string> = {
      Created: 'Nueva solicitud de turno',
      Confirmed: 'Turno confirmado',
      Cancelled: 'Turno cancelado',
      Completed: 'Turno completado',
      NoShow: 'No se presentó',
    };

    return {
      id: event.appointmentId,
      eventType: event.eventType,
      title: titles[event.eventType] ?? `Turno: ${event.eventType}`,
      body: `${event.businessName} — ${event.serviceName}`,
      businessName: event.businessName,
      serviceName: event.serviceName,
      scheduledDate: event.scheduledDate,
      read: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Task 2.2: Shows an actionable AlertController with Accept/Reject buttons.
   * Used when Owner receives a new appointment request.
   */
  async showActionableAlert(
    message: string,
    onAccept: () => void,
    onReject: () => void
  ): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nueva solicitud de turno',
      message,
      cssClass: 'alert-neon',
      buttons: [
        {
          text: 'Rechazar',
          role: 'cancel',
          cssClass: 'alert-btn-reject',
          handler: () => {
            console.debug('[NotifyService] Owner rejected appointment');
            onReject();
          },
        },
        {
          text: 'Aceptar',
          role: 'confirm',
          cssClass: 'alert-btn-accept',
          handler: () => {
            console.debug('[NotifyService] Owner accepted appointment');
            onAccept();
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Task 2.3: Shows an auto-dismissing toast (no actions).
   * Used when Client receives appointment status updates.
   */
  async showAutoDismissToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const iconMap: Record<string, string> = {
      success: 'checkmark-circle-outline',
      warning: 'warning-outline',
      danger: 'warning-outline'
    };

    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'bottom',
      color,
      icon: iconMap[color],
      cssClass: `toast-neon toast-neon-${color}`,
    });

    await toast.present();
  }

  /**
   * Task 2.1: Main entry point for all SignalR appointment events.
   *
   * Flow:
   * 1. Build NotificationItem from DTO
   * 2. Deduplicate — drop if same event within 30s window
   * 3. Save to localStorage history + increment badge
   * 4. Show UI only if app was visible:
   *    - Owner + Created → showActionableAlert (Accept/Reject)
   *    - Client + (Confirmed|Cancelled) → showAutoDismissToast
   *    - All other combos → silent (just badge + history)
   *
   * @param event  The SignalR event DTO
   * @param role   'owner' | 'client'
   */
  async handleAppointmentEvent(event: AppointmentEventDto, role: 'owner' | 'employee' | 'client'): Promise<void> {
    console.log(`[NotifyService] INCOMING EVENT: ${event.eventType} | Target Role: ${role}`);
    
    // Step 1: Build the item
    const item = this.buildNotificationItem(event);

    // Step 2: Deduplicate
    if (this.isDuplicate(event.eventType, event.appointmentId)) {
      console.log('[NotifyService] Dropping duplicate event:', event.eventType, event.appointmentId);
      return;
    }

    // Step 3: Save to history (always — even if app was hidden)
    this.saveToHistory(item);

    // Step 4: Show UI only if app was visible
    if (!this.wasAppVisible()) {
      console.log('[NotifyService] App was hidden — notification saved, badge updated silently. visibilityState:', document.visibilityState);
      return; 
    }

    console.log(`[NotifyService] Passed deduplication and visibility check. Role is: ${role}`);

    // Owner / Employee + new appointment request → actionable alert
    if ((role === 'owner' || role === 'employee') && event.eventType === 'Created') {
      console.log('[NotifyService] Showing Actionable Alert to Owner!');
      await this.showActionableAlert(
        `${event.businessName} — ${event.serviceName}\n${event.scheduledDate}`,
        // Accept handler → emit confirmation
        () => this.appointmentActionEmitted$.next({ event, action: 'accept' }),
        // Reject handler → emit cancellation
        () => this.appointmentActionEmitted$.next({ event, action: 'reject' })
      );
      return;
    }

    // Owner / Employee + other relevant status updates
    if (role === 'owner' || role === 'employee') {
      if (event.eventType === 'Cancelled') {
        const body = `Cita cancelada: ${event.businessName} — ${event.serviceName}`;
        await this.showAutoDismissToast(body, 'danger');
        return;
      }
      // If another employee/owner confirmed or completed
      if (event.eventType === 'Confirmed' || event.eventType === 'Completed') {
        const body = `Cita actualizada: ${event.businessName} — ${event.serviceName}`;
        await this.showAutoDismissToast(body, 'success');
        return;
      }
    }

    // Client + status updates
    if (role === 'client') {
      if (event.eventType === 'Confirmed') {
        await this.showAutoDismissToast(`Cita confirmada: ${event.businessName} — ${event.serviceName}`, 'success');
        return;
      }
      if (event.eventType === 'Cancelled') {
        await this.showAutoDismissToast(`Cita cancelada: ${event.businessName} — ${event.serviceName}`, 'danger');
        return;
      }
      if (event.eventType === 'Completed') {
        await this.showAutoDismissToast(`Cita completada: ${event.businessName} — ${event.serviceName}`, 'success');
        return;
      }
      if (event.eventType === 'NoShow') {
        await this.showAutoDismissToast(`No te presentaste: ${event.businessName} — ${event.serviceName}`, 'warning');
        return;
      }
    }

    // All other combos: silent update (badge + history already done in step 3)
    console.log('[NotifyService] Silent notification — badge updated:', item.title);
  }

  /**
   * Subject for appointment actions triggered by the actionable alert (Accept/Reject).
   * SignalRService (Phase 4) will subscribe to this and invoke the hub methods.
   */
  readonly appointmentActionEmitted$ = new Subject<{ event: AppointmentEventDto; action: 'accept' | 'reject' }>();
}
