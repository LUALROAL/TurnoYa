import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, save } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateEmployeeRequest, UpdateEmployeeRequest } from '../../models';
import { OwnerEmployeesService } from '../../services/owner-employees.service';
import { AppPhoto } from 'src/app/features/owner-business/services/photo.service';
import { PhotoService } from 'src/app/features/owner-business/services/photo.service';
 // 👈 Importar desde core

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
  ],
  templateUrl: './employee-form.page.html',
  styleUrl: './employee-form.page.scss',
})
export class EmployeeFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerEmployeesService = inject(OwnerEmployeesService);
  private readonly notify = inject(NotifyService);
  private readonly photoService = inject(PhotoService) as PhotoService; // 👈 Inyectar PhotoService tipado
  private readonly destroy$ = new Subject<void>();

  employeeForm!: FormGroup;
  businessId = '';
  employeeId = '';
  isEditMode = false;
  loading = false;
  saving = false;

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  existingPhotoBase64: string | null = null;

  selectedImageForPreview: string | null = null; // 👈 Para el modal de preview

  constructor() {
    addIcons({ arrowBack, save });
    this.initForm();
  }

  ngOnInit(): void {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.employeeId = this.route.snapshot.paramMap.get('employeeId') || '';
    this.isEditMode = !!this.employeeId;

    if (!this.businessId) {
      this.notify.showError('No se encontró el negocio');
      this.onCancel();
      return;
    }

    if (this.isEditMode) {
      this.loadEmployee();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PÚBLICOS =====

  onCancel(): void {
    if (this.businessId) {
      this.router.navigate(['/owner/businesses', this.businessId, 'employees']);
      return;
    }
    this.router.navigate(['/owner/businesses']);
  }

  onSave(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.notify.showError('Por favor valida los campos obligatorios del empleado');
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateEmployee();
      return;
    }

    this.createEmployee();
  }

  get formControls() {
    return this.employeeForm.controls;
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

    if (control.hasError('email')) {
      return 'Ingresa un email válido';
    }

    if (control.hasError('pattern')) {
      return 'Formato inválido';
    }

    return 'Valor inválido';
  }

  // ===== MÉTODOS DE FOTO =====

  async takePhoto() {
    try {
      const photo = await this.photoService.takePhoto();
      await this.addPhotoToSelection(photo);
    } catch (error) {
      console.error('Error al tomar foto:', error);
      this.notify.showError('No se pudo tomar la foto');
    }
  }

  async selectFromGallery() {
    try {
      const photos = await this.photoService.selectImages();
      if (photos.length > 0) {
        await this.addPhotoToSelection(photos[0]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      this.notify.showError('No se pudo seleccionar la imagen');
    }
  }

  private async addPhotoToSelection(photo: AppPhoto) {
    try {
      let file: File;
      if (photo.base64String) {
        file = this.base64ToFile(photo.base64String, `photo_${Date.now()}.jpg`, 'image/jpeg');
      } else if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      } else {
        throw new Error('Formato de imagen no soportado');
      }
      this.selectedPhotoFile = file;
      if (photo.webPath) {
        this.photoPreview = photo.webPath;
      } else if (photo.base64String) {
        this.photoPreview = photo.base64String;
      }
      // Opcionalmente, eliminar la foto existente si se reemplaza
      this.existingPhotoBase64 = null;
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      this.notify.showError('Error al procesar la imagen');
    }
  }

  removePhoto() {
    this.selectedPhotoFile = null;
    this.photoPreview = null;
    this.existingPhotoBase64 = null;
  }

  private base64ToFile(base64: string, filename: string, mimeType: string): File {
    if (base64.startsWith('data:')) {
      const arr = base64.split(',');
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mimeType });
    }
    const bstr = atob(base64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  }

  // ===== PREVIEW DE IMAGEN =====

  openImagePreview(imagePath: string) {
    this.selectedImageForPreview = imagePath;
  }

  closePreview() {
    this.selectedImageForPreview = null;
  }

  // ===== MÉTODOS PRIVADOS =====

  private initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      position: ['', [Validators.maxLength(120)]],
      phone: ['', [Validators.pattern(/^[0-9+\-() ]*$/)]],
      email: ['', [Validators.email]],
      profilePictureUrl: ['', [Validators.pattern(/^(https?:\/\/).+/i)]],
      bio: ['', [Validators.maxLength(500)]],
      isActive: [true],
    });
  }

  private loadEmployee(): void {
    this.loading = true;
    this.ownerEmployeesService
      .getById(this.employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: employee => {
          const nameFallback = this.splitFullName(employee.fullName);
          this.existingPhotoBase64 = employee.photoBase64 || null;
          this.employeeForm.patchValue({
            firstName: employee.firstName?.trim() || nameFallback.firstName,
            lastName: employee.lastName?.trim() || nameFallback.lastName,
            position: employee.position || '',
            phone: employee.phone || '',
            email: employee.email || '',
            profilePictureUrl: employee.profilePictureUrl || '',
            bio: employee.bio || '',
            isActive: employee.isActive,
          });
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar empleado:', error);
          this.notify.showError('No se pudo cargar el empleado');
          this.loading = false;
          this.onCancel();
        },
      });
  }

  private splitFullName(fullName?: string): { firstName: string; lastName: string } {
    if (!fullName || !fullName.trim()) {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private createEmployee(): void {
    const formValue = this.employeeForm.value;

    const request: CreateEmployeeRequest = {
      firstName: formValue.firstName?.trim().toUpperCase(),
      lastName: formValue.lastName?.trim().toUpperCase(),
      position: formValue.position?.trim().toUpperCase() || undefined,
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      profilePictureUrl: formValue.profilePictureUrl?.trim() || undefined,
      bio: formValue.bio?.trim() || undefined,
      isActive: true,
    };

    this.ownerEmployeesService
      .create(this.businessId, request, this.selectedPhotoFile || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdEmployee) => {
          this.saving = false;
          this.router.navigate(['/owner/businesses', this.businessId, 'employees', createdEmployee.id, 'schedule']);
          this.notify.showSuccess('Empleado creado correctamente');
        },
        error: (error: unknown) => {
          console.error('Error al crear empleado:', error);
          this.notify.showError('No se pudo crear el empleado');
          this.saving = false;
        },
      });
  }

  private updateEmployee(): void {
    const formValue = this.employeeForm.value;

    const request: UpdateEmployeeRequest = {
      firstName: formValue.firstName?.trim().toUpperCase() || undefined,
      lastName: formValue.lastName?.trim().toUpperCase() || undefined,
      position: formValue.position?.trim().toUpperCase() || undefined,
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      profilePictureUrl: formValue.profilePictureUrl?.trim() || undefined,
      bio: formValue.bio?.trim() || undefined,
      isActive: !!formValue.isActive,
    };

    this.ownerEmployeesService
      .update(this.employeeId, request, this.selectedPhotoFile || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/owner/businesses', this.businessId, 'employees']);
          this.notify.showSuccess('Empleado actualizado correctamente');
        },
        error: (error: unknown) => {
          console.error('Error al actualizar empleado:', error);
          this.notify.showError('No se pudo actualizar el empleado');
          this.saving = false;
        },
      });
  }
}
