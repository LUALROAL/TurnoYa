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
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonSpinner,
  LoadingController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  callOutline,
  mailOutline,
  timeOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { Business, BusinessDetail } from '../../../core/models';

@Component({
  selector: 'app-business-detail',
  templateUrl: './business-detail.page.html',
  styleUrls: ['./business-detail.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonSpinner
  ]
})
export class BusinessDetailPage implements OnInit {
  business: BusinessDetail | null = null;
  isLoading = true;
  isOwner = false;
  businessId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      locationOutline,
      callOutline,
      mailOutline,
      timeOutline,
      createOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';
    if (this.businessId) {
      this.loadBusiness();
      this.checkOwnership();
    }
  }

  loadBusiness() {
    this.isLoading = true;
    this.businessService.getBusinessById(this.businessId).subscribe({
      next: (response) => {
        const payload = (response && (response as any).data) ? (response as any).data : response;
        this.business = payload as BusinessDetail;
        this.isLoading = false;
        // Recalcular propiedad de dueño una vez cargado el negocio
        this.checkOwnership();
      },
      error: async (error) => {
        this.isLoading = false;
        await this.showToast('Error al cargar el negocio', 'danger');
        this.router.navigate(['/business/list']);
      }
    });
  }

  checkOwnership() {
    this.authService.currentUser$.subscribe(user => {
      if (user && this.business) {
        this.isOwner = user.id === this.business.ownerId;
      }
    });
  }

  editBusiness() {
    this.router.navigate(['/business/form', this.businessId]);
  }

  async deleteBusiness() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este negocio?',
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
              message: 'Eliminando negocio...'
            });
            await loading.present();

            this.businessService.deleteBusiness(this.businessId).subscribe({
              next: async () => {
                await loading.dismiss();
                await this.showToast('Negocio eliminado exitosamente', 'success');
                this.router.navigate(['/business/list']);
              },
              error: async (error) => {
                await loading.dismiss();
                await this.showToast('Error al eliminar el negocio', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  bookAppointment() {
    this.router.navigate(['/appointments/create'], {
      queryParams: { businessId: this.businessId }
    });
  }

  viewBusinessAppointments() {
    this.router.navigate(['/appointments/business', this.businessId]);
  }

  navigateToServices() {
    this.router.navigate(['/business', this.businessId, 'services']);
  }

  navigateToEmployees() {
    this.router.navigate(['/business', this.businessId, 'employees']);
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek] || '';
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
