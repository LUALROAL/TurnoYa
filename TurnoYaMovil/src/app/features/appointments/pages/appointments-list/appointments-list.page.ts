import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  cashOutline,
  closeCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { AppointmentItem } from '../../models';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonButton, IonIcon],
  templateUrl: './appointments-list.page.html',
  styleUrl: './appointments-list.page.scss',
})
export class AppointmentsListPage implements OnInit, OnDestroy {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  protected loading = true;
  protected isEmpty = false;
  protected appointments: AppointmentItem[] = [];
  protected processingIds = new Set<string>();

  constructor() {
    addIcons({ arrowBackOutline, calendarOutline, timeOutline, cashOutline, closeCircleOutline });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.loadAppointments();
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

  protected canCancel(appointment: AppointmentItem): boolean {
    const status = this.normalizeStatus(appointment.status);
    return status === 'pending' || status === 'confirmed';
  }

  protected isProcessing(appointmentId: string): boolean {
    return this.processingIds.has(appointmentId);
  }

  protected cancelAppointment(appointment: AppointmentItem): void {
    if (this.isProcessing(appointment.id)) return;
    const confirmed = confirm('¿Cancelar esta cita?');

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
      .getMy()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments: AppointmentItem[]) => {
          this.appointments = appointments;
          this.isEmpty = appointments.length === 0;
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar citas:', error);
          this.notify.showError('No se pudieron cargar tus citas');
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
