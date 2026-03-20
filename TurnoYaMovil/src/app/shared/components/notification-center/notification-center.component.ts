import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, closeOutline, checkmarkCircleOutline, timeOutline, alertCircle } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService, NotificationItem } from '../../../core/services/notify.service';

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
  imports: [IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonToolbar, NgClass],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  private readonly notifyService = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  /** Notification history loaded from localStorage */
  protected notifications: NotificationItem[] = [];

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
   * Loads notification history from NotifyService.
   */
  private loadHistory(): void {
    this.isLoading = true;
    // Small delay to allow animations to complete
    setTimeout(() => {
      this.notifications = this.notifyService.getHistory();
      this.isLoading = false;
    }, 100);
  }

  /**
   * Task 3.4: Handles tap on notification item.
   * Marks notification as read if unread.
   */
  onNotificationTap(notification: NotificationItem): void {
    if (!notification.read) {
      this.notifyService.markAsRead(notification.id);
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
  getEventTypeLabel(eventType: NotificationItem['eventType']): string {
    const labels: Record<NotificationItem['eventType'], string> = {
      Created: 'Solicitud',
      Confirmed: 'Confirmado',
      Cancelled: 'Cancelado',
      Completed: 'Completado',
      NoShow: 'No asistido',
    };
    return labels[eventType] ?? eventType;
  }

  /**
   * Returns CSS class for event type badge.
   */
  getEventTypeClass(eventType: NotificationItem['eventType']): string {
    const classes: Record<NotificationItem['eventType'], string> = {
      Created: 'badge-created',
      Confirmed: 'badge-confirmed',
      Cancelled: 'badge-cancelled',
      Completed: 'badge-completed',
      NoShow: 'badge-noshow',
    };
    return classes[eventType] ?? 'badge-default';
  }
}
