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
  IonButton,
  IonSpinner,
  IonIcon,
  AlertController,
  ToastController,
  LoadingController,
  ActionSheetController
} from '@ionic/angular/standalone';
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
    IonButtons,
    IonBackButton,
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
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController
  ) { }

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
        this.showToast('No se encontró la cita', 'danger');
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
        error: () => { this.isOwner = false; }
      });
    });
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'Pending': 'hourglass-outline',
      'Confirmed': 'checkmark-circle-outline',
      'Completed': 'ribbon-outline',
      'Cancelled': 'close-circle-outline'
    };
    return icons[status] || 'help-circle-outline';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Pending': 'Pendiente de Confirmación',
      'Confirmed': 'Confirmado',
      'Completed': 'Finalizado',
      'Cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusDescription(status: string): string {
    const desc: { [key: string]: string } = {
      'Pending': 'El negocio debe aceptar tu solicitud.',
      'Confirmed': '¡Todo listo! Te esperamos en la fecha y hora indicadas.',
      'Completed': 'Gracias por confiar en nosotros.',
      'Cancelled': 'Este turno ha sido cancelado.'
    };
    return desc[status] || '';
  }

  async presentOwnerActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Gestionar Turno',
      buttons: [
        {
          text: 'Confirmar Turno',
          icon: 'checkmark-circle',
          cssClass: !this.canConfirm() ? 'disabled-action' : '',
          handler: () => { if (this.canConfirm()) this.confirmAppointment(); }
        },
        {
          text: 'Completar Turno',
          icon: 'checkmark-done-circle',
          handler: () => { this.completeAppointment(); }
        },
        {
          text: 'Editar',
          icon: 'create',
          handler: () => { this.editAppointment(); }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash',
          handler: () => { this.deleteAppointment(); }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // Helper to visually disable actions in sheet if not applicable, though simple logic is fine too
  canConfirm() { return this.appointment?.status === 'Pending'; }

  async cancelAppointment() {
    const alert = await this.alertController.create({
      header: 'Cancelar Cita',
      message: '¿Seguro que deseas cancelar?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => { this.processCancellation(); }
        }
      ]
    });
    await alert.present();
  }

  async processCancellation() {
    const loading = await this.loadingController.create({ message: 'Cancelando...' });
    await loading.present();
    this.appointmentService.cancel(this.appointmentId, 'Cancelado por usuario').subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showToast('Cita cancelada', 'success');
        this.loadAppointment(); // Reload to show new status instead of nav back immediately?
      },
      error: async () => {
        await loading.dismiss();
        await this.showToast('Error al cancelar', 'danger');
      }
    });
  }

  editAppointment() {
    this.router.navigate(['/appointments/edit', this.appointmentId]);
  }

  async confirmAppointment() {
    this.updateStatus('Confirmed', 'Cita confirmada');
  }

  async completeAppointment() {
    this.updateStatus('Completed', 'Cita completada');
  }

  async updateStatus(status: 'Confirmed' | 'Completed' | 'Cancelled', successMsg: string) {
    const loading = await this.loadingController.create({ message: 'Procesando...' });
    await loading.present();
    this.appointmentService.updateStatus(this.appointmentId, status).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showToast(successMsg, 'success');
        this.loadAppointment();
      },
      error: async () => {
        await loading.dismiss();
        await this.showToast('Error al actualizar estado', 'danger');
      }
    });
  }

  async deleteAppointment() {
    const alert = await this.alertController.create({
      header: 'Eliminar Permanentemente',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.appointmentService.delete(this.appointmentId).subscribe(() => {
              this.router.navigate(['/appointments/list']);
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
