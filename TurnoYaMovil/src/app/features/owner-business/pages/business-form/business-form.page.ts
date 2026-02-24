import { CityService } from '../../../city/services/city.service';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
  IonCheckbox,
  IonModal
} from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  save,
  syncOutline,
  warningOutline,
  businessOutline,
  documentTextOutline,
  globeOutline,
  locationOutline,
  mapOutline,
  callOutline,
  mailOutline,
  cameraOutline,
  imageOutline,
  closeOutline,
  trashOutline,
  expandOutline
} from 'ionicons/icons';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { BusinessService } from '../../../business/services/business.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateBusinessRequest, UpdateBusinessRequest, BusinessImage } from '../../models';
import { AppPhoto, PhotoService } from '../../services/photo.service';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
  ],
  templateUrl: './business-form.page.html',
  styleUrls: ['./business-form.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BusinessFormPage implements OnInit, OnDestroy {
  private readonly cityService = inject(CityService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly notify = inject(NotifyService);
  private readonly businessService = inject(BusinessService);
  private readonly photoService = inject(PhotoService);
  private readonly destroy$ = new Subject<void>();

  businessForm!: FormGroup;
  businessId: string = '';
  isEditMode = false;
  loading = false;
  saving = false;

  // Imágenes
  selectedImages: File[] = [];
  existingImages: BusinessImage[] = [];
  imagePreviews: string[] = [];
  selectedImageForPreview: string | null = null;

  // Autocomplete suggestions
  departmentSuggestions: string[] = [];
  citySuggestions: { name: string }[] = [];
  categorySuggestions: string[] = [];
  showCategorySuggestions = false;
  selectedDepartment: string = '';

  categories: string[] = [];

  // New properties for custom category support
  isCustomCategory = false;
  customCategoryValue = '';

  constructor() {
    addIcons({
      arrowBack,
      save,
      syncOutline,
      warningOutline,
      businessOutline,
      documentTextOutline,
      globeOutline,
      locationOutline,
      mapOutline,
      callOutline,
      mailOutline,
      cameraOutline,
      imageOutline,
      closeOutline,
      trashOutline,
      expandOutline
    });
    this.initForm();
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.businessId;

    // Load categories from backend
    this.businessService.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories) => {
        this.categories = categories;
        // Always add 'Otro' option at the end if not present
        if (!this.categories.some(cat => cat.toLowerCase() === 'otro' || cat.toLowerCase() === 'otros')) {
          this.categories.push('Otro');
        }
      },
      error: () => {
        this.categories = ['Otro'];
      }
    });

    if (this.isEditMode) {
      this.loadBusiness();
    }
  }

  ngOnDestroy() {
    // Limpiar previews
    this.imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.businessForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      category: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      address: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
        Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z]).{5,200}$/)
      ]],
      city: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      department: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern(/^[0-9]{7,15}$/)]],
      email: ['', [Validators.email]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]],
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
          // Guardar imágenes existentes
          if (business.images && business.images.length > 0) {
            this.existingImages = business.images;
          }

          // Si la categoría ya está en la lista, seleccionarla directamente
          const categoryLower = business.category?.toLowerCase() || '';
          const categoriesLower = this.categories.map(c => c.toLowerCase());
          const isCustom = !!(business.category &&
            !categoriesLower.includes(categoryLower) &&
            categoryLower !== 'otro');

          // Si la categoría no está en la lista y no es personalizada, agregarla ANTES de hacer patchValue
          if (!categoriesLower.includes(categoryLower) && business.category) {
            this.categories.push(business.category);
          }

          // Si hay departamento, habilitar ciudad ANTES del patchValue
          if (business.department) {
            this.businessForm.get('city')?.enable();
          }

          // Si la categoría ya está en la lista, seleccionarla directamente y NO mostrar campo personalizado
          const showCustom = !this.categories.map(c => c.toLowerCase()).includes(categoryLower) && categoryLower !== 'otro';

          this.businessForm.patchValue({
            name: business.name,
            description: business.description || '',
            category: showCustom ? 'Otro' : business.category,
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

          this.businessForm.get('city')?.updateValueAndValidity();

          this.isCustomCategory = showCustom;
          this.customCategoryValue = showCustom ? business.category : '';

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

  // ===== MÉTODOS PARA MANEJO DE IMÁGENES =====

  /**
   * Tomar foto con la cámara
   */
  async takePhoto() {
    try {
      const photo = await this.photoService.takePhoto();
      await this.addPhotoToSelection(photo);
    } catch (error) {
      console.error('Error al tomar foto:', error);
      this.notify.showError('No se pudo tomar la foto');
    }
  }

  /**
   * Seleccionar foto de la galería
   */
  async selectFromGallery() {
    try {
      const photos = await this.photoService.selectImages();
      for (const photo of photos) {
        await this.addPhotoToSelection(photo);
      }
    } catch (error) {
      console.error('Error al seleccionar imágenes:', error);
      this.notify.showError('No se pudieron seleccionar las imágenes');
    }
  }

  /**
   * Añadir foto a la selección
   */
  private async addPhotoToSelection(photo: AppPhoto) {
    try {
      // Convertir a File
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

      this.selectedImages.push(file);

      // Crear preview
      if (photo.webPath) {
        this.imagePreviews.push(photo.webPath);
      } else if (photo.base64String) {
        this.imagePreviews.push(photo.base64String);
      }
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      this.notify.showError('Error al procesar la imagen');
    }
  }

  /**
   * Convertir base64 a File
   */
  private base64ToFile(base64: string, filename: string, mimeType: string): File {
    // Si es una URL de datos (data:image/jpeg;base64,...)
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

    // Si es base64 puro
    const bstr = atob(base64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  }

  /**
   * Eliminar imagen seleccionada
   */
  removeSelectedImage(index: number) {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  /**
   * Eliminar imagen existente
   */
  removeExistingImage(imageId: string) {
    this.existingImages = this.existingImages.filter(img => img.id !== imageId);
    // Nota: La eliminación real en el backend requeriría un endpoint específico
    // Por ahora, solo la removemos de la lista local
  }

  /**
   * Abrir preview de imagen
   */
  openImagePreview(imagePath: string) {
    this.selectedImageForPreview = imagePath;
  }

  /**
   * Cerrar preview
   */
  closePreview() {
    this.selectedImageForPreview = null;
  }

  // ===== MÉTODOS PARA GUARDAR =====

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
    let categoryValue = formValue.category?.trim();
    if (this.isCustomCategory && this.customCategoryValue.trim()) {
      categoryValue = this.customCategoryValue.trim();
    }
    let websiteValue = formValue.website?.trim() || undefined;
    if (websiteValue && !/^https?:\/\//i.test(websiteValue)) {
      websiteValue = 'https://' + websiteValue;
    }

    const request: CreateBusinessRequest = {
      name: formValue.name?.trim(),
      description: formValue.description?.trim() || undefined,
      category: categoryValue,
      address: formValue.address?.trim(),
      city: formValue.city?.trim(),
      department: formValue.department?.trim(),
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      website: websiteValue,
      latitude: formValue.latitude ? parseFloat(formValue.latitude) : undefined,
      longitude: formValue.longitude ? parseFloat(formValue.longitude) : undefined,
    };

    // Si hay imágenes, usar el método con imágenes
    if (this.selectedImages.length > 0) {
      this.ownerBusinessService
        .createWithImages(request, this.selectedImages)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notify.showSuccess('Negocio creado correctamente');
            this.cleanup();
            this.router.navigate(['/owner/businesses']);
          },
          error: (error) => {
            console.error('Error al crear negocio:', error);
            this.notify.showError(error.error?.message || 'Error al crear el negocio');
            this.saving = false;
          },
        });
    } else {
      // Sin imágenes, usar método legacy
      this.ownerBusinessService
        .create(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notify.showSuccess('Negocio creado correctamente');
            this.cleanup();
            this.router.navigate(['/owner/businesses']);
          },
          error: (error) => {
            console.error('Error al crear negocio:', error);
            this.notify.showError(error.error?.message || 'Error al crear el negocio');
            this.saving = false;
          },
        });
    }
  }

  private updateBusiness() {
    const formValue = this.businessForm.value;
    let categoryValue = formValue.category?.trim();
    if (this.isCustomCategory && this.customCategoryValue.trim()) {
      categoryValue = this.customCategoryValue.trim();
    }
    let websiteValue = formValue.website?.trim() || undefined;
    if (websiteValue && !/^https?:\/\//i.test(websiteValue)) {
      websiteValue = 'https://' + websiteValue;
    }

    const request: UpdateBusinessRequest = {
      name: formValue.name?.trim() || undefined,
      description: formValue.description?.trim() || undefined,
      category: categoryValue || undefined,
      address: formValue.address?.trim() || undefined,
      city: formValue.city?.trim() || undefined,
      department: formValue.department?.trim() || undefined,
      phone: formValue.phone?.trim() || undefined,
      email: formValue.email?.trim() || undefined,
      website: websiteValue,
      latitude: formValue.latitude ? parseFloat(formValue.latitude) : undefined,
      longitude: formValue.longitude ? parseFloat(formValue.longitude) : undefined,
      isActive: formValue.isActive,
    };

    // Si hay nuevas imágenes, usar el método con imágenes
    // Siempre usar FormData (multipart/form-data) para cumplir con el backend
    this.ownerBusinessService
      .updateWithImages(this.businessId, request, this.selectedImages)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess('Negocio actualizado correctamente');
          this.cleanup();
          this.router.navigate(['/owner/businesses']);
        },
        error: (error) => {
          console.error('Error al actualizar negocio:', error);
          this.notify.showError(error.error?.message || 'Error al actualizar el negocio');
          this.saving = false;
        },
      });
  }

  private cleanup() {
    this.isCustomCategory = false;
    this.customCategoryValue = '';
    this.saving = false;
    // Limpiar previews
    this.imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    this.selectedImages = [];
    this.imagePreviews = [];
  }

  onCancel() {
    this.cleanup();
    this.router.navigate(['/owner/businesses']);
  }

  get formControls() {
    return this.businessForm.controls;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.businessForm.get(fieldName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      switch (fieldName) {
        case 'name': return 'El nombre es obligatorio';
        case 'category': return 'La categoría es obligatoria';
        case 'address': return 'La dirección es obligatoria';
        case 'department': return 'El departamento es obligatorio';
        case 'city': return 'La ciudad es obligatoria';
        default: return 'Este campo es requerido';
      }
    }
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control.hasError('pattern')) {
      if (fieldName === 'phone') return 'El teléfono debe contener entre 7 y 15 dígitos';
      if (fieldName === 'website') return 'El sitio web debe comenzar con http:// o https://';
      if (fieldName === 'address') return 'La dirección debe contener letras y números (ej: Calle 45 #12-34)';
      return 'Formato no válido';
    }
    if (control.hasError('email')) {
      return 'Email no válido';
    }
    if (control.hasError('min')) {
      if (fieldName === 'latitude') return 'La latitud debe estar entre -90 y 90';
      if (fieldName === 'longitude') return 'La longitud debe estar entre -180 y 180';
    }
    if (control.hasError('max')) {
      if (fieldName === 'latitude') return 'La latitud debe estar entre -90 y 90';
      if (fieldName === 'longitude') return 'La longitud debe estar entre -180 y 180';
    }
    return '';
  }

  compareValues(a: any, b: any): boolean {
    return a === b;
  }

  // ===== MÉTODOS PARA AUTOCOMPLETE DE CATEGORÍA =====

  onCategoryInput(value: string = ''): void {
    this.showCategorySuggestions = true;
    this.isCustomCategory = false;
    if (!value) {
      this.categorySuggestions = [...this.categories];
      return;
    }
    const searchTerm = value.toLowerCase();
    this.categorySuggestions = this.categories.filter(cat =>
      cat.toLowerCase().includes(searchTerm)
    );
    if (searchTerm === 'otro' || searchTerm === 'otros') {
      this.isCustomCategory = true;
    }
  }

  onCategoryFocus(): void {
    this.showCategorySuggestions = true;
    this.categorySuggestions = [...this.categories];
  }

  onCategorySelect(category: string): void {
    this.businessForm.patchValue({ category });
    this.categorySuggestions = [];
    this.showCategorySuggestions = false;
    if (category.toLowerCase() === 'otro' || category.toLowerCase() === 'otros') {
      this.isCustomCategory = true;
    } else {
      this.isCustomCategory = false;
    }
  }

  // ===== MÉTODOS PARA AUTOCOMPLETE DE DEPARTAMENTO =====

  onDepartmentInput(value: string = ''): void {
    if (value.length >= 2) {
      this.cityService.searchDepartments(value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (results: string[]) => {
            this.departmentSuggestions = results;
          },
          error: () => {
            this.departmentSuggestions = [];
          }
        });
    } else {
      this.departmentSuggestions = [];
    }
  }

  onDepartmentSelect(department: string): void {
    this.businessForm.patchValue({ department });
    this.departmentSuggestions = [];

    const cityControl = this.businessForm.get('city');
    cityControl?.enable();

    if (department.toLowerCase().includes('bogotá') ||
        department.toLowerCase().includes('bogota')) {
      this.businessForm.patchValue({ city: 'Bogotá' });
      this.citySuggestions = [];
    } else {
      this.businessForm.patchValue({ city: '' });
      this.citySuggestions = [];
    }
  }

  // ===== MÉTODOS PARA AUTOCOMPLETE DE CIUDAD =====

  onCityInput(value: string = ''): void {
    const department = this.businessForm.get('department')?.value;

    if (value.length >= 2 && department) {
      this.cityService.searchCities(value, department)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (results: string[]) => {
            this.citySuggestions = results.map(name => ({ name }));
          },
          error: () => {
            this.citySuggestions = [];
          }
        });
    } else {
      this.citySuggestions = [];
    }
  }

  onCitySelect(city: string): void {
    this.businessForm.patchValue({ city });
    this.citySuggestions = [];
  }

  // ===== MÉTODO PARA CERRAR MENÚS =====

  onClickOutside(): void {
    setTimeout(() => {
      // Detecta el elemento activo
      const active = document.activeElement as HTMLElement | null;
      const catInput = document.getElementById('category');
      const catMenu = document.querySelector('.category-suggestions-menu');
      // Si el foco está en el input de categoría o en el menú, no cerrar
      if (active === catInput || (catMenu && catMenu.contains(active))) {
        // No cerrar menú de categorías
      } else {
        this.showCategorySuggestions = false;
        this.categorySuggestions = [];
      }
      // Siempre cerrar sugerencias de ciudad y departamento
      this.departmentSuggestions = [];
      this.citySuggestions = [];
    }, 200);
  }
}
