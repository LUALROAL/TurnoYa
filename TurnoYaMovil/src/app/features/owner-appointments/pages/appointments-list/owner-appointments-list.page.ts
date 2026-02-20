import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, calendarOutline, cashOutline, timeOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { AppointmentItem } from '../../../appointments/models';
import { AppointmentsService } from '../../../appointments/services/appointments.service';

@Component({
  selector: 'app-owner-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonButton, IonIcon],
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

  constructor() {
    addIcons({ arrowBackOutline, calendarOutline, timeOutline, cashOutline });
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
}
