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
  IonIcon,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  trashOutline
} from 'ionicons/icons';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';
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
    IonSpinner,
    IonIcon
  ]
})
export class AppointmentDetailPage implements OnInit {
  isLoading = false;
  appointment: Appointment | null = null;
  appointmentId = '';
  isOwner = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private businessService: BusinessService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      createOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      trashOutline
    });
  }

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
        this.checkOwnership();
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/appointments/list']);
      }
    });
  }

  checkOwnership() {
    if (!this.appointment?.businessId) return;

    this.authService.currentUser$.subscribe(user => {
      if (!user) return;

      this.businessService.getBusinessById(this.appointment!.businessId).subscribe({
        next: (response) => {
          const business = (response && (response as any).data) ? (response as any).data : response;
          this.isOwner = user.id === business.ownerId || user.role === 'Admin';
        },
        error: () => {
          this.isOwner = false;
        }
      });
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

  editAppointment() {
    this.router.navigate(['/appointments/edit', this.appointmentId]);
  }

  async confirmAppointment() {
    const alert = await this.alertController.create({
      header: 'Confirmar Cita',
      message: '¿Deseas confirmar esta cita?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Confirmando cita...'
            });
            await loading.present();

            this.appointmentService.updateStatus(this.appointmentId, 'Confirmed').subscribe({
              next: async () => {
                await loading.dismiss();
                await this.showToast('Cita confirmada exitosamente', 'success');
                this.loadAppointment();
              },
              error: async () => {
                await loading.dismiss();
                await this.showToast('Error al confirmar la cita', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async completeAppointment() {
    const alert = await this.alertController.create({
      header: 'Completar Cita',
      message: '¿Marcar esta cita como completada?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Completar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Actualizando cita...'
            });
            await loading.present();

            this.appointmentService.updateStatus(this.appointmentId, 'Completed').subscribe({
              next: async () => {
                await loading.dismiss();
                await this.showToast('Cita completada exitosamente', 'success');
                this.loadAppointment();
              },
              error: async () => {
                await loading.dismiss();
                await this.showToast('Error al completar la cita', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteAppointment() {
    const alert = await this.alertController.create({
      header: 'Eliminar Cita',
      message: '¿Estás seguro de que deseas eliminar permanentemente esta cita? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando cita...'
            });
            await loading.present();

            this.appointmentService.delete(this.appointmentId).subscribe({
              next: async () => {
                await loading.dismiss();
                await this.showToast('Cita eliminada exitosamente', 'success');
                this.router.navigate(['/appointments/list']);
              },
              error: async () => {
                await loading.dismiss();
                await this.showToast('Error al eliminar la cita', 'danger');
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
