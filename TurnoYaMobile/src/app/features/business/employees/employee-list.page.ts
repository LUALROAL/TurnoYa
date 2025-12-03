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
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, addCircleOutline } from 'ionicons/icons';
import { BusinessService } from '../../../core/services/business.service';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.page.html',
  styleUrls: ['./employee-list.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonIcon
  ]
})
export class EmployeeListPage implements OnInit {
  isLoading = false;
  businessId = '';
  employees: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ createOutline, trashOutline, addCircleOutline });
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.load();
  }

  load() {
    this.isLoading = true;
    this.businessService.getBusinessEmployees(this.businessId).subscribe({
      next: (data: any) => {
        this.employees = Array.isArray(data) ? data : ((data as any)?.data || []);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  handleRefresh(ev: any) {
    this.businessService.getBusinessEmployees(this.businessId).subscribe({
      next: (data: any) => {
        this.employees = Array.isArray(data) ? data : ((data as any)?.data || []);
        ev.target.complete();
      },
      error: () => ev.target.complete()
    });
  }

  addEmployee() {
    this.router.navigate(['/business', this.businessId, 'employees', 'form']);
  }

  editEmployee(employeeId: string) {
    this.router.navigate(['/business', this.businessId, 'employees', 'form', employeeId]);
  }

  async deleteEmployee(employeeId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de eliminar este empleado?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.businessService.deleteEmployee(employeeId).subscribe({
              next: async () => {
                const toast = await this.toastController.create({
                  message: 'Empleado eliminado',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
                this.load();
              },
              error: async () => {
                const toast = await this.toastController.create({
                  message: 'Error al eliminar empleado',
                  duration: 3000,
                  color: 'danger'
                });
                await toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
