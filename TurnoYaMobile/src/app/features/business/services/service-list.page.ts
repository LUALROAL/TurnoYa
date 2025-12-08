import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  pencilOutline,
  trashOutline,
  addOutline,
  timeOutline,
  cashOutline,
  cubeOutline
} from 'ionicons/icons';
import { BusinessService } from '../../../core/services/business.service';
import { Service } from '../../../core/models';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.page.html',
  styleUrls: ['./service-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel
  ]
})
export class ServiceListPage implements OnInit {
  isLoading = false;
  businessId = '';
  services: Service[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      createOutline,
      pencilOutline,
      trashOutline,
      addOutline,
      timeOutline,
      cashOutline,
      cubeOutline
    });
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.load();
  }

  load() {
    if (!this.businessId) return;
    this.isLoading = true;
    this.businessService.getBusinessServices(this.businessId).subscribe({
      next: (data: any) => {
        this.services = Array.isArray(data) ? data : ((data as any)?.data || []);
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast('Error al cargar servicios', 'danger');
      }
    });
  }

  handleRefresh(ev: any) {
    this.businessService.getBusinessServices(this.businessId).subscribe({
      next: (data: any) => {
        this.services = Array.isArray(data) ? data : ((data as any)?.data || []);
        ev.target.complete();
      },
      error: () => ev.target.complete()
    });
  }

  addService() {
    this.router.navigate(['/business', this.businessId, 'services', 'form']);
  }

  editService(id: string) {
    this.router.navigate(['/business', this.businessId, 'services', 'form', id]);
  }

  async deleteService(id: string) {
    const alert = await this.alertController.create({
      header: 'Eliminar servicio',
      message: '¿Deseas eliminar este servicio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive', handler: async () => {
            this.businessService.deleteService(id).subscribe({
              next: async () => {
                await this.showToast('Servicio eliminado', 'success');
                this.load();
              },
              error: async () => {
                await this.showToast('Error al eliminar', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
