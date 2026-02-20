import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, calendarOutline, cashOutline, timeOutline } from 'ionicons/icons';
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

  constructor() {
    addIcons({ arrowBackOutline, calendarOutline, timeOutline, cashOutline });
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

  protected getStatusLabel(status: string): string {
    const normalized = (status || '').toLowerCase();
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
        return status || 'Estado';
    }
  }

  protected getStatusClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'completed') return 'status-pill success';
    if (normalized === 'confirmed') return 'status-pill info';
    if (normalized === 'cancelled' || normalized === 'noshow') return 'status-pill danger';
    return 'status-pill warning';
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
}
