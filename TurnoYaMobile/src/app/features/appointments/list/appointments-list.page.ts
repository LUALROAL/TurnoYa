import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonIcon,
  IonButton,
  ToastController
} from '@ionic/angular/standalone';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../core/models';
// Icons handled globally

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.page.html',
  styleUrls: ['./appointments-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonButtons,
    IonBackButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonIcon,
    IonButton
  ]
})
export class AppointmentsListPage implements OnInit {
  isLoading = false;
  status = 'Upcoming';
  appointments: Appointment[] = [];

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.appointments = [];

    this.appointmentService.getMyAppointments(this.status).subscribe({
      next: (response: any) => {
        let rawData: any[] = [];
        if (Array.isArray(response)) rawData = response;
        else if (response?.data && Array.isArray(response.data)) rawData = response.data;

        // Robust Mapping
        this.appointments = rawData.map(item => ({
          id: item.id || item._id,
          businessId: item.businessId || item.negocioId,
          serviceId: item.serviceId || item.servicioId,
          userId: item.userId || item.usuarioId,
          startDate: item.startDate || item.fechaInicio,
          endDate: item.endDate || item.fechaFin,
          status: (item.status || item.estado || AppointmentStatus.Pending) as AppointmentStatus,
          notes: item.notes,
          business: item.business ? { name: item.business.name || 'Negocio' } : undefined,
          service: item.service ? { name: item.service.name || 'Servicio', price: item.service.price } : undefined
        } as Appointment));

        this.isLoading = false;
      },
      error: async (error) => {
        this.isLoading = false;
        await this.showToast('Error al cargar citas');
      }
    });
  }

  onStatusChange(newStatus: string) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.loadAppointments();
    }
  }

  viewDetail(id: string) {
    this.router.navigate(['/appointments/detail', id]);
  }

  handleRefresh(event: any) {
    this.status = 'Upcoming'; // Reset to default on pull refresh? Or keep current? Let's keep current.
    this.loadAppointments();
    setTimeout(() => {
      event.target.complete();
    }, 800);
  }

  getStatusLabel(status: string): string {
    const map: { [key: string]: string } = {
      'Pending': 'Pendiente',
      'Confirmed': 'Confirmada',
      'Cancelled': 'Cancelada',
      'Completed': 'Completada'
    };
    return map[status] || status;
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}
