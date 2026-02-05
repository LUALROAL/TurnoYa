import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  ToastController
} from '@ionic/angular/standalone';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models';

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.page.html',
  styleUrls: ['./appointments-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent
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

  /* Helper para extraer datos de cualquier formato de respuesta */
  private extractData(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.items && Array.isArray(response.items)) {
      return response.items;
    } else if (response?.result && Array.isArray(response.result)) {
      return response.result;
    } else if (typeof response === 'object' && response !== null) {
      return [response];
    }
    return [];
  }

  loadAppointments() {
    this.isLoading = true;
    console.log('📅 loadAppointments() loading status:', this.status);

    this.appointmentService.getMyAppointments(this.status).subscribe({
      next: (response) => {
        console.log('✅ Appointments response:', JSON.stringify(response));
        this.appointments = this.extractData(response);
        console.log(`✅ Loaded ${this.appointments.length} appointments`);
        this.isLoading = false;
      },
      error: async (error) => {
        console.error('❌ Error loading appointments:', error);
        this.isLoading = false;
        await this.showErrorToast(error);
      }
    });
  }

  onStatusChange(ev: any) {
    this.status = ev?.detail?.value ?? 'Upcoming';
    this.appointments = []; // Limpiar lista al cambiar tab
    this.loadAppointments();
  }

  viewDetail(id: string) {
    this.router.navigate(['/appointments/detail', id]);
  }

  handleRefresh(event: any) {
    this.appointmentService.getMyAppointments(this.status).subscribe({
      next: (response) => {
        this.appointments = this.extractData(response);
        event.target.complete();
      },
      error: async (error) => {
        event.target.complete();
        await this.showErrorToast(error);
      }
    });
  }

  private async showErrorToast(error: any) {
    let msg = 'Error al cargar citas.';
    if (error.status === 401) {
      msg = 'Sesión expirada.';
      this.router.navigate(['/login']);
    } else if (error.status === 0) {
      msg = 'Sin conexión al servidor.';
    }

    const toast = await this.toastController.create({
      message: msg,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
}
