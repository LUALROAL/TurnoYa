import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  cashOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  closeCircleOutline,
  timeOutline,
  constructOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { AppointmentItem } from '../../../appointments/models';
import { AppointmentsService } from '../../../appointments/services/appointments.service';

@Component({
  selector: 'app-owner-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  templateUrl: './owner-appointments-list.page.html',
  styleUrl: './owner-appointments-list.page.scss',
})
export class OwnerAppointmentsListPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected isEmpty = false;
  protected appointments: AppointmentItem[] = [];
  protected processingIds = new Set<string>();

  constructor() {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      calendarOutline,
      cashOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      closeCircleOutline,
      timeOutline,
      constructOutline,
    });
  }

  ngOnInit(): void {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';

    if (!this.businessId) {
      this.notify.showError('No se encontró el negocio');
      this.loading = false;
      this.isEmpty = true;
      return;
    }

    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    if (this.businessId) {
      this.loadAppointments();
    }
  }

  protected trackByAppointmentId(_: number, appointment: AppointmentItem): string {
    return appointment.id;
  }

  protected getStatusLabel(status: string | number): string {
    const normalized = this.normalizeStatus(status);
    switch (normalized) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'noshow':
        return 'No asistió';
      default:
        return status != null ? String(status) : 'Estado';
    }
  }

  protected getStatusClass(status: string | number): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'completed') return 'status-pill success';
    if (normalized === 'confirmed') return 'status-pill info';
    if (normalized === 'cancelled' || normalized === 'noshow') return 'status-pill danger';
    return 'status-pill warning';
  }

  protected canConfirm(appointment: AppointmentItem): boolean {
    return this.normalizeStatus(appointment.status) === 'pending';
  }

  protected canComplete(appointment: AppointmentItem): boolean {
    return this.normalizeStatus(appointment.status) === 'confirmed';
  }

  protected canCancel(appointment: AppointmentItem): boolean {
    const status = this.normalizeStatus(appointment.status);
    return status === 'pending' || status === 'confirmed';
  }

  protected canNoShow(appointment: AppointmentItem): boolean {
    return this.normalizeStatus(appointment.status) === 'confirmed';
  }

  protected isProcessing(appointmentId: string): boolean {
    return this.processingIds.has(appointmentId);
  }

  protected confirmAppointment(appointment: AppointmentItem): void {
    if (this.isProcessing(appointment.id)) return;
    this.setProcessing(appointment.id, true);

    this.appointmentsService
      .confirm(appointment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          appointment.status = 'confirmed';
          this.notify.showSuccess('Cita confirmada');
          this.setProcessing(appointment.id, false);
        },
        error: (error: unknown) => {
          console.error('Error al confirmar cita:', error);
          this.notify.showError('No se pudo confirmar la cita');
          this.setProcessing(appointment.id, false);
        },
      });
  }

  protected completeAppointment(appointment: AppointmentItem): void {
    if (this.isProcessing(appointment.id)) return;
    this.setProcessing(appointment.id, true);

    this.appointmentsService
      .complete(appointment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          appointment.status = 'completed';
          this.notify.showSuccess('Cita completada');
          this.setProcessing(appointment.id, false);
        },
        error: (error: unknown) => {
          console.error('Error al completar cita:', error);
          this.notify.showError('No se pudo completar la cita');
          this.setProcessing(appointment.id, false);
        },
      });
  }

  protected noShowAppointment(appointment: AppointmentItem): void {
    if (this.isProcessing(appointment.id)) return;
    const confirmed = confirm('¿Marcar esta cita como no asistió?');

    if (!confirmed) {
      return;
    }

    this.setProcessing(appointment.id, true);

    this.appointmentsService
      .markNoShow(appointment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          appointment.status = 'noshow';
          this.notify.showSuccess('Cita marcada como no asistió');
          this.setProcessing(appointment.id, false);
        },
        error: (error: unknown) => {
          console.error('Error al marcar no asistió:', error);
          this.notify.showError('No se pudo actualizar la cita');
          this.setProcessing(appointment.id, false);
        },
      });
  }

  protected cancelAppointment(appointment: AppointmentItem): void {
    if (this.isProcessing(appointment.id)) return;
    const confirmed = confirm('¿Estás seguro de cancelar esta cita?');

    if (!confirmed) {
      return;
    }

    const reason = prompt('Motivo de cancelación (opcional)')?.trim();
    this.setProcessing(appointment.id, true);

    this.appointmentsService
      .cancel(appointment.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          appointment.status = 'cancelled';
          this.notify.showSuccess('Cita cancelada');
          this.setProcessing(appointment.id, false);
        },
        error: (error: unknown) => {
          console.error('Error al cancelar cita:', error);
          this.notify.showError('No se pudo cancelar la cita');
          this.setProcessing(appointment.id, false);
        },
      });
  }

  private loadAppointments(): void {
    this.loading = true;

    this.appointmentsService
      .getByBusiness(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments: AppointmentItem[]) => {
          this.appointments = [...appointments].sort(
            (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
          );
          this.isEmpty = appointments.length === 0;
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar agenda del negocio:', error);
          this.notify.showError('No se pudo cargar la agenda del negocio');
          this.appointments = [];
          this.isEmpty = true;
          this.loading = false;
        },
      });
  }

  private normalizeStatus(status: string | number): string {
    if (typeof status === 'number') {
      return this.mapStatusNumber(status);
    }

    const trimmed = (status || '').toString().trim();
    if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
      return this.mapStatusNumber(Number(trimmed));
    }

    return trimmed.toLowerCase();
  }

  private mapStatusNumber(value: number): string {
    switch (value) {
      case 0:
        return 'pending';
      case 1:
        return 'confirmed';
      case 2:
        return 'completed';
      case 3:
        return 'cancelled';
      case 4:
        return 'noshow';
      default:
        return '';
    }
  }

  private setProcessing(appointmentId: string, isProcessing: boolean): void {
    if (isProcessing) {
      this.processingIds.add(appointmentId);
    } else {
      this.processingIds.delete(appointmentId);
    }
  }
}
