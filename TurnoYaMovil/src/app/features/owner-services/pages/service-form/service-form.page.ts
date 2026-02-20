import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, save } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateServiceRequest, UpdateServiceRequest } from '../../models';
import { OwnerServicesService } from '../../services/owner-services.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonCheckbox,
  ],
  templateUrl: './service-form.page.html',
  styleUrl: './service-form.page.scss',
})
export class ServiceFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerServicesService = inject(OwnerServicesService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  serviceForm!: FormGroup;
  businessId = '';
  serviceId = '';
  isEditMode = false;
  loading = false;
  saving = false;

  constructor() {
    addIcons({ arrowBack, save });
    this.initForm();
  }

  ngOnInit(): void {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.serviceId = this.route.snapshot.paramMap.get('serviceId') || '';
    this.isEditMode = !!this.serviceId;

    if (!this.businessId) {
      this.notify.showError('No se encontró el negocio');
      this.onCancel();
      return;
    }

    if (this.isEditMode) {
      this.loadService();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onCancel(): void {
    if (this.businessId) {
      this.router.navigate(['/owner/businesses', this.businessId, 'services']);
      return;
    }

    this.router.navigate(['/owner/businesses']);
  }

  protected onSave(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.notify.showError('Por favor valida los campos obligatorios del servicio');
      return;
    }

    const requiresDeposit = !!this.serviceForm.value.requiresDeposit;
    const depositAmountValue = this.serviceForm.value.depositAmount;
    const depositAmount = depositAmountValue ? parseFloat(depositAmountValue) : undefined;

    if (requiresDeposit && (!depositAmount || depositAmount <= 0)) {
      this.notify.showError('Debes indicar un anticipo mayor a 0 cuando el servicio lo requiere');
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateService();
      return;
    }

    this.createService();
  }

  get formControls() {
    return this.serviceForm.controls;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.formControls[fieldName];

    if (!control) {
      return 'Campo inválido';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (control.hasError('minlength')) {
      return `Debe tener al menos ${control.errors?.['minlength']?.requiredLength} caracteres`;
    }

    if (control.hasError('maxlength')) {
      return `No puede superar ${control.errors?.['maxlength']?.requiredLength} caracteres`;
    }

    if (control.hasError('min')) {
      return `El valor mínimo permitido es ${control.errors?.['min']?.min}`;
    }

    return 'Valor inválido';
  }

  private initForm(): void {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      description: ['', [Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0)]],
      duration: ['', [Validators.required, Validators.min(5)]],
      requiresDeposit: [false],
      depositAmount: [''],
      isActive: [true],
    });
  }

  private loadService(): void {
    this.loading = true;

    this.ownerServicesService
      .getById(this.serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: service => {
          this.serviceForm.patchValue({
            name: service.name,
            description: service.description || '',
            price: service.price,
            duration: service.duration,
            requiresDeposit: service.requiresDeposit,
            depositAmount: service.depositAmount ?? '',
            isActive: service.isActive,
          });
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar servicio:', error);
          this.notify.showError('No se pudo cargar el servicio');
          this.loading = false;
          this.onCancel();
        },
      });
  }

  private createService(): void {
    const formValue = this.serviceForm.value;

    const request: CreateServiceRequest = {
      name: formValue.name?.trim(),
      description: formValue.description?.trim() || undefined,
      price: parseFloat(formValue.price),
      duration: parseInt(formValue.duration, 10),
      requiresDeposit: !!formValue.requiresDeposit,
      depositAmount: formValue.requiresDeposit && formValue.depositAmount
        ? parseFloat(formValue.depositAmount)
        : undefined,
      isActive: true,
    };

    this.ownerServicesService
      .create(this.businessId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/owner/businesses', this.businessId, 'services']);
        },
        error: (error: unknown) => {
          console.error('Error al crear servicio:', error);
          this.notify.showError('No se pudo crear el servicio');
          this.saving = false;
        },
      });
  }

  private updateService(): void {
    const formValue = this.serviceForm.value;

    const request: UpdateServiceRequest = {
      name: formValue.name?.trim() || undefined,
      description: formValue.description?.trim() || undefined,
      price: formValue.price !== '' ? parseFloat(formValue.price) : undefined,
      duration: formValue.duration !== '' ? parseInt(formValue.duration, 10) : undefined,
      requiresDeposit: !!formValue.requiresDeposit,
      depositAmount: formValue.requiresDeposit && formValue.depositAmount
        ? parseFloat(formValue.depositAmount)
        : undefined,
      isActive: !!formValue.isActive,
    };

    this.ownerServicesService
      .update(this.serviceId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/owner/businesses', this.businessId, 'services']);
        },
        error: (error: unknown) => {
          console.error('Error al actualizar servicio:', error);
          this.notify.showError('No se pudo actualizar el servicio');
          this.saving = false;
        },
      });
  }
}
