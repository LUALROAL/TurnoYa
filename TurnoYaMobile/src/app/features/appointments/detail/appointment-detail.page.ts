import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models';

@Component({
  selector: 'app-appointment-detail',
  templateUrl: './appointment-detail.page.html',
  styleUrls: ['./appointment-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonSpinner
  ]
})
export class AppointmentDetailPage implements OnInit {
  isLoading = false;
  appointment: Appointment | null = null;
  appointmentId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.appointmentId) {
      this.loadAppointment();
    }
  }

  loadAppointment() {
    this.isLoading = true;
    this.appointmentService.getById(this.appointmentId).subscribe({
      next: (data) => {
        this.appointment = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/appointments/list']);
      }
    });
  }

  async cancelAppointment() {
    const alert = await this.alertController.create({
      header: 'Cancelar Cita',
      message: '¿Estás seguro de que deseas cancelar esta cita?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo de cancelación (opcional)'
        }
      ],
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: async (data) => {
            const loading = await this.loadingController.create({
              message: 'Cancelando cita...'
            });
            await loading.present();

            this.appointmentService.cancel(this.appointmentId, data.reason).subscribe({
              next: async () => {
                await loading.dismiss();
                await this.showToast('Cita cancelada exitosamente', 'success');
                this.router.navigate(['/appointments/list']);
              },
              error: async (error) => {
                await loading.dismiss();
                await this.showToast('Error al cancelar la cita', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
