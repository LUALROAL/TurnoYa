import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, save, trash } from 'ionicons/icons';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateBusinessRequest, UpdateBusinessRequest } from '../../models';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
  ],
  templateUrl: './business-form.page.html',
  styleUrl: './business-form.page.scss',
})
export class BusinessFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  businessForm!: FormGroup;
  businessId: string = '';
  isEditMode = false;
  loading = false;
  saving = false;

  categories = [
    'Salón de Belleza',
    'Peluquería',
    'Spa',
    'Estética',
    'Masajes',
    'Consultoría',
    'Taller Automotriz',
    'Dentista',
    'Médico',
    'Otros',
  ];

  departments = [
    'Amazonas',
    'Antioquia',
    'Arauca',
    'Atlántico',
    'Bolívar',
    'Boyacá',
    'Caldas',
    'Caquetá',
    'Casanare',
    'Cauca',
    'Cesar',
    'Chocó',
    'Córdoba',
    'Cundinamarca',
    'Guainía',
    'Guaviare',
    'Huila',
    'La Guajira',
    'Magdalena',
    'Meta',
    'Nariño',
    'Norte de Santander',
    'Putumayo',
    'Quindío',
    'Risaralda',
    'Santander',
    'Sucre',
    'Tolima',
    'Valle del Cauca',
    'Vaupés',
    'Vichada',
  ];

  constructor() {
    addIcons({ arrowBack, save, trash });
    this.initForm();
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.businessId;

    if (this.isEditMode) {
      this.loadBusiness();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.businessForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      category: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      department: ['', Validators.required],
      phone: ['', [Validators.pattern(/^[0-9+\-() ]*$/)]],
      email: ['', [Validators.email]],
      website: ['', [Validators.pattern(/^(https?:\/\/)?.{1,}$/i)]],
      latitude: [''],
      longitude: [''],
      isActive: [true],
    });
  }

  private loadBusiness() {
    this.loading = true;
    this.ownerBusinessService
      .getById(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (business) => {
          this.businessForm.patchValue({
            name: business.name,
            description: business.description || '',
            category: business.category,
            address: business.address,
            city: business.city,
            department: business.department,
            phone: business.phone || '',
            email: business.email || '',
            website: business.website || '',
            latitude: business.latitude?.toString() || '',
            longitude: business.longitude?.toString() || '',
            isActive: business.isActive,
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar negocio:', error);
          this.notify.showError('Error al cargar los datos del negocio');
          this.loading = false;
          this.router.navigate(['/owner/businesses']);
        },
      });
  }

  onSave() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      this.notify.showError('Por favor, completa los campos requeridos correctamente');
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateBusiness();
    } else {
      this.createBusiness();
    }
  }

  private createBusiness() {
    const formValue = this.businessForm.value;
    const request: CreateBusinessRequest = {
      name: formValue.name?.trim(),
      description: formValue.description?.trim() || undefined,
      category: formValue.category?.trim(),
      address: formValue.address?.trim(),
      city: formValue.city?.trim(),
      department: formValue.department?.trim(),
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      website: formValue.website?.trim() || undefined,
      latitude: formValue.latitude ? parseFloat(formValue.latitude) : undefined,
      longitude: formValue.longitude ? parseFloat(formValue.longitude) : undefined,
    };

    this.ownerBusinessService
      .create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Negocio creado correctamente');
          this.saving = false;
          this.router.navigate(['/owner/businesses']);
        },
        error: (error) => {
          console.error('Error al crear negocio:', error);
          this.notify.showError('Error al crear el negocio');
          this.saving = false;
        },
      });
  }

  private updateBusiness() {
    const formValue = this.businessForm.value;
    const request: UpdateBusinessRequest = {
      name: formValue.name?.trim() || undefined,
      description: formValue.description?.trim() || undefined,
      category: formValue.category?.trim() || undefined,
      address: formValue.address?.trim() || undefined,
      city: formValue.city?.trim() || undefined,
      department: formValue.department?.trim() || undefined,
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      website: formValue.website?.trim() || undefined,
      latitude: formValue.latitude ? parseFloat(formValue.latitude) : undefined,
      longitude: formValue.longitude ? parseFloat(formValue.longitude) : undefined,
      isActive: formValue.isActive,
    };

    this.ownerBusinessService
      .update(this.businessId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Negocio actualizado correctamente');
          this.saving = false;
          this.router.navigate(['/owner/businesses']);
        },
        error: (error) => {
          console.error('Error al actualizar negocio:', error);
          this.notify.showError('Error al actualizar el negocio');
          this.saving = false;
        },
      });
  }

  onDelete() {
    if (confirm('¿Estás seguro de que deseas eliminar este negocio? Esta acción no se puede deshacer.')) {
      this.saving = true;

      this.ownerBusinessService
        .delete(this.businessId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Negocio eliminado correctamente');
            this.saving = false;
            this.router.navigate(['/owner/businesses']);
          },
          error: (error) => {
            console.error('Error al eliminar negocio:', error);
            this.notify.showError('Error al eliminar el negocio');
            this.saving = false;
          },
        });
    }
  }

  onCancel() {
    this.router.navigate(['/owner/businesses']);
  }

  get formControls() {
    return this.businessForm.controls;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.businessForm.get(fieldName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control.hasError('email')) {
      return 'Email no válido';
    }
    if (control.hasError('pattern')) {
      if (fieldName === 'phone') return 'Teléfono no válido';
      if (fieldName === 'website') return 'URL no válida';
    }

    return '';
  }

  compareValues(a: any, b: any): boolean {
    return a === b;
  }
}
