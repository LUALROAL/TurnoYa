import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonIcon,
  AlertController,
  ActionSheetController,
  ToastController
} from '@ionic/angular/standalone';
// addIcons removed, handled globally

import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessDetail } from '../../../core/models';

@Component({
  selector: 'app-business-detail',
  templateUrl: './business-detail.page.html',
  styleUrls: ['./business-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonButton,
    IonIcon
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
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';
    if (this.businessId) {
      this.loadBusiness();
    }
  }

  ionViewWillEnter() {
    if (this.businessId) {
      this.loadBusiness();
    }
  }

  loadBusiness() {
    this.isLoading = true;
    this.businessService.getBusinessById(this.businessId).subscribe({
      next: (response) => {
        const payload = (response && (response as any).data) ? (response as any).data : response;
        this.business = payload as BusinessDetail;
        this.isLoading = false;
        this.checkOwnership();
      },
      error: async (error) => {
        this.isLoading = false;
        // console.error('Error al cargar negocio:', error);
        this.router.navigate(['/business/list']);
      }
    });
  }

  checkOwnership() {
    if (!this.business) return;

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        const ownerId = this.business?.owner?.id || this.business?.ownerId;
        this.isOwner = user.id === ownerId;
      }
    });
  }

  // New Action Sheet for Owner Actions (Neo-Turno pattern: simplify UI clutter)
  async presentOwnerActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Administrar Negocio',
      buttons: [
        {
          text: 'Editar Información',
          icon: 'create',
          handler: () => { this.editBusiness(); }
        },
        {
          text: 'Ver Citas',
          icon: 'calendar',
          handler: () => { this.viewBusinessAppointments(); }
        },
        {
          text: 'Gestionar Servicios',
          icon: 'albums',
          handler: () => { this.navigateToServices(); }
        },
        {
          text: 'Gestionar Empleados',
          icon: 'people',
          handler: () => { this.navigateToEmployees(); }
        },
        {
          text: 'Eliminar Negocio',
          role: 'destructive',
          icon: 'trash',
          handler: () => { this.deleteBusiness(); }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close',
        }
      ]
    });
    await actionSheet.present();
  }

  editBusiness() {
    this.router.navigate(['/business/form', this.businessId]);
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

  async deleteBusiness() {
    const alert = await this.alertController.create({
      header: '¿Estás seguro?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.businessService.deleteBusiness(this.businessId).subscribe(() => {
              this.router.navigate(['/business/list']);
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
}
