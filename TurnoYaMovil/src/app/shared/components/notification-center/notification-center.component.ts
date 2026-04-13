import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, closeOutline, checkmarkCircleOutline, timeOutline, alertCircle } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService, NotificationItem, EmployeeNotificationItem } from '../../../core/services/notify.service';

/**
 * Unified notification type for display
 */
export interface UnifiedNotification {
  id: string;
  type: 'appointment' | 'employee';
  eventType: string;
  title: string;
  body: string;
  businessName: string;
  read: boolean;
  timestamp: number;
}

/**
 * Task 3.1: NotificationCenterComponent TypeScript
 * 
 * Standalone component that displays notification history from localStorage.
 * Receives data from NotifyService via getHistory().
 * Supports mark-as-read on tap and clear-all functionality.
 */
@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonToolbar, NgClass, DatePipe],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
  host: { class: 'ion-page' }
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  private readonly notifyService = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  /** Unified notification history (appointments + employees) */
  protected notifications: UnifiedNotification[] = [];

  /** Loading state while fetching history */
  protected isLoading = true;

  constructor() {
    addIcons({
      trashOutline,
      closeOutline,
      checkmarkCircleOutline,
      timeOutline,
      alertCircle,
    });
  }

  ngOnInit(): void {
    // Subscribe to notification updates to refresh list in real-time
    this.notifyService.notificationCenterRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadHistory();
      });

    // Initial load
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads notification history from NotifyService (both appointments and employees).
   */
  private loadHistory(): void {
    this.isLoading = true;
    // Small delay to allow animations to complete
    setTimeout(() => {
      // Get appointment notifications
      const appointmentNotifications = this.notifyService.getHistory().map(item => ({
        id: item.id,
        type: 'appointment' as const,
        eventType: item.eventType,
        title: item.title,
        body: item.body,
        businessName: item.businessName,
        read: item.read,
        timestamp: item.timestamp,
      }));

      // Get employee notifications
      const employeeNotifications = this.notifyService.getEmployeeHistory().map(item => ({
        id: item.id,
        type: 'employee' as const,
        eventType: item.eventType,
        title: item.title,
        body: item.body,
        businessName: item.businessName,
        read: item.read,
        timestamp: item.timestamp,
      }));

      // Combine and sort by timestamp (newest first)
      this.notifications = [...appointmentNotifications, ...employeeNotifications]
        .sort((a, b) => b.timestamp - a.timestamp);

      this.isLoading = false;
    }, 100);
  }

  /**
   * Task 3.4: Handles tap on notification item.
   * Marks notification as read if unread.
   */
  onNotificationTap(notification: UnifiedNotification): void {
    if (!notification.read) {
      if (notification.type === 'employee') {
        this.notifyService.markEmployeeAsRead(notification.id);
      } else {
        this.notifyService.markAsRead(notification.id);
      }
      // Update local state immediately for responsive UI
      const index = this.notifications.findIndex(n => n.id === notification.id);
      if (index !== -1) {
        this.notifications[index] = { ...notification, read: true };
      }
    }
  }

  /**
   * Task 3.4: Clears all notifications.
   */
  clearAll(): void {
    this.notifyService.clearAll();
    this.notifyService.clearEmployeeAll();
    this.notifications = [];
  }

  /**
   * Closes the modal (called by close button).
   */
  close(): void {
    this.notifyService.closeModal();
  }

  /**
   * Returns true if there are no notifications.
   */
  get isEmpty(): boolean {
    return !this.isLoading && this.notifications.length === 0;
  }

  /**
   * Returns true if there are unread notifications.
   */
  get hasUnread(): boolean {
    return this.notifications.some(n => !n.read);
  }

  /**
   * Formats the event type for display.
   */
  getEventTypeLabel(notification: UnifiedNotification): string {
    if (notification.type === 'employee') {
      const labels: Record<string, string> = {
        Linked: 'Vinculado',
        Unlinked: 'Desvinculado',
      };
      return labels[notification.eventType] ?? notification.eventType;
    }
    
    const labels: Record<NotificationItem['eventType'], string> = {
      Created: 'Solicitud',
      Confirmed: 'Confirmado',
      Cancelled: 'Cancelado',
      Completed: 'Completado',
      NoShow: 'No asistido',
    };
    return labels[notification.eventType as NotificationItem['eventType']] ?? notification.eventType;
  }

  /**
   * Returns CSS class for event type badge.
   */
  getEventTypeClass(notification: UnifiedNotification): string {
    if (notification.type === 'employee') {
      return notification.eventType === 'Linked' ? 'badge-linked' : 'badge-unlinked';
    }
    
    const classes: Record<NotificationItem['eventType'], string> = {
      Created: 'badge-created',
      Confirmed: 'badge-confirmed',
      Cancelled: 'badge-cancelled',
      Completed: 'badge-completed',
      NoShow: 'badge-noshow',
    };
    return classes[notification.eventType as NotificationItem['eventType']] ?? 'badge-default';
  }
}
