import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonTextarea,
  IonButton,
  IonSpinner,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ServiceService } from '../../../core/services/service.service';
import { Appointment, Service } from '../../../core/models';

@Component({
  selector: 'app-appointment-edit',
  templateUrl: './appointment-edit.page.html',
  styleUrls: ['./appointment-edit.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonTextarea,
    IonButton,
    IonSpinner
  ]
})
export class AppointmentEditPage implements OnInit {
  appointmentForm!: FormGroup;
  services: Service[] = [];
  today = new Date().toISOString();
  isLoading = true;
  appointmentId = '';
  appointment: Appointment | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private serviceService: ServiceService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadAppointment();
  }

  initForm() {
    this.appointmentForm = this.fb.group({
      serviceId: ['', Validators.required],
      startDate: ['', Validators.required],
      notes: ['']
    });
  }

  loadAppointment() {
    this.isLoading = true;
    this.appointmentService.getById(this.appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.loadServices(appointment.businessId);
        this.appointmentForm.patchValue({
          serviceId: appointment.serviceId,
          startDate: appointment.startDate,
          notes: appointment.notes || ''
        });
      },
      error: async () => {
        await this.showToast('Error al cargar la cita', 'danger');
        this.router.navigate(['/appointments/list']);
      }
    });
  }

  loadServices(businessId: string) {
    this.serviceService.getByBusiness(businessId).subscribe({
      next: (services) => {
        this.services = services;
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast('Error al cargar los servicios', 'danger');
      }
    });
  }

  async onSubmit() {
    if (this.appointmentForm.invalid) return;

    const loading = await this.loadingController.create({
      message: 'Actualizando cita...'
    });
    await loading.present();

    const formData = this.appointmentForm.value;

    this.appointmentService.update(this.appointmentId, formData).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showToast('Cita actualizada exitosamente', 'success');
        this.router.navigate(['/appointments/detail', this.appointmentId]);
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Error al actualizar la cita';
        await this.showToast(message, 'danger');
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
