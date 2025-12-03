import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AppointmentService } from '../../../core/services/appointment.service';
import { BusinessService } from '../../../core/services/business.service';
import { Service, BusinessDetail } from '../../../core/models';

@Component({
  selector: 'app-appointment-create',
  templateUrl: './appointment-create.page.html',
  styleUrls: ['./appointment-create.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonTextarea,
    IonButton,
    IonDatetime,
    IonSelect,
    IonSelectOption
  ]
})
export class AppointmentCreatePage implements OnInit {
  appointmentForm!: FormGroup;
  businessId = '';
  services: Service[] = [];
  isLoading = false;
  today = new Date().toISOString();

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private businessService: BusinessService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.queryParamMap.get('businessId') || '';
    this.initializeForm();
    if (this.businessId) {
      this.loadServices();
    }
  }

  initializeForm() {
    this.appointmentForm = this.formBuilder.group({
      serviceId: ['', Validators.required],
      startDate: ['', Validators.required],
      notes: ['']
    });
  }

  loadServices() {
    this.isLoading = true;
    this.businessService.getBusinessById(this.businessId).subscribe({
      next: (response) => {
        if (response.data) {
          const businessDetail = response.data as BusinessDetail;
          if (businessDetail.services) {
            this.services = businessDetail.services;
          }
        }
        this.isLoading = false;
      },
      error: async (error) => {
        this.isLoading = false;
        await this.showToast('Error al cargar servicios', 'danger');
      }
    });
  }

  async onSubmit() {
    if (this.appointmentForm.invalid || !this.businessId) {
      await this.showToast('Completa todos los campos requeridos', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando cita...'
    });
    await loading.present();

    const formData = this.appointmentForm.value;
    const createData = {
      businessId: this.businessId,
      serviceId: formData.serviceId,
      startDate: formData.startDate,
      notes: formData.notes
    };

    this.appointmentService.create(createData).subscribe({
      next: async (response) => {
        await loading.dismiss();
        await this.showToast('Cita creada exitosamente', 'success');
        this.router.navigate(['/appointments/detail', response.id]);
      },
      error: async (error) => {
        await loading.dismiss();
        await this.showToast('Error al crear la cita', 'danger');
      }
    });
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
