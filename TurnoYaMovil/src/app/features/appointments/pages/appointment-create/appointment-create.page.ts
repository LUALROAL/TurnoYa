import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  calendarOutline,
  personOutline,
  save,
  timeOutline,
  warningOutline,
  chatbubbleOutline,
  syncOutline
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { BusinessDetail, BusinessEmployeeItem, BusinessServiceItem } from '../../../business/models';
import { BusinessService } from '../../../business/services/business.service';
import { CreateAppointmentRequest } from '../../models';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
  templateUrl: './appointment-create.page.html',
  styleUrl: './appointment-create.page.scss',
})
export class AppointmentCreatePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly businessService = inject(BusinessService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected saving = false;
  protected business: BusinessDetail | null = null;
  protected services: BusinessServiceItem[] = [];
  protected employees: BusinessEmployeeItem[] = [];
  protected appointmentForm: FormGroup;

  constructor() {
    addIcons({
      arrowBack,
      calendarOutline,
      timeOutline,
      personOutline,
      save,
      warningOutline,
      chatbubbleOutline,
      syncOutline
    });

    this.appointmentForm = this.fb.group({
      serviceId: ['', Validators.required],
      employeeId: [''],
      scheduledDate: ['', Validators.required],
      scheduledTime: ['', Validators.required],
      notes: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.businessId) {
      this.notify.showError('No se encontró el negocio');
      this.router.navigate(['/businesses']);
      return;
    }

    this.loadBusiness();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onCancel(): void {
    this.router.navigate(['/businesses', this.businessId]);
  }

  protected onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.notify.showError('Completa los campos obligatorios para agendar la cita');
      return;
    }

    const formValue = this.appointmentForm.value;
    const scheduledDateTime = `${formValue.scheduledDate}T${formValue.scheduledTime}:00`;
    const scheduledDate = new Date(scheduledDateTime);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      this.notify.showError('La fecha y hora de la cita debe ser posterior al momento actual');
      return;
    }

    const request: CreateAppointmentRequest = {
      businessId: this.businessId,
      serviceId: formValue.serviceId,
      employeeId: formValue.employeeId || undefined,
      scheduledDate: scheduledDateTime,
      notes: formValue.notes?.trim() || undefined,
    };

    this.saving = true;

    this.appointmentsService
      .create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.showSuccess('¡Cita agendada exitosamente!');
          this.router.navigate(['/businesses', this.businessId]);
        },
        error: (error: unknown) => {
          console.error('Error al agendar cita:', error);
          this.notify.showError('No se pudo agendar la cita');
          this.saving = false;
        },
      });
  }

  protected get formControls() {
    return this.appointmentForm.controls;
  }

  // Método para obtener la fecha mínima (hoy)
  protected getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private loadBusiness(): void {
    this.loading = true;

    this.businessService
      .getById(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (business: BusinessDetail) => {
          this.business = business;
          this.services = business.services.filter(service => service.isActive);
          this.employees = business.employees.filter(employee => employee.isActive);
          this.loading = false;

          if (this.services.length === 1) {
            this.appointmentForm.patchValue({ serviceId: this.services[0].id });
          }
        },
        error: (error: unknown) => {
          console.error('Error al cargar negocio:', error);
          this.notify.showError('No se pudo cargar la información del negocio');
          this.loading = false;
          this.router.navigate(['/businesses']);
        },
      });
  }
}
