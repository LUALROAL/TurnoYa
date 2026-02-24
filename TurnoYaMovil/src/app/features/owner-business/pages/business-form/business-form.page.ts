import { CityService } from '../../../city/services/city.service';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  mailOutline
} from 'ionicons/icons';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { BusinessService } from '../../../business/services/business.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateBusinessRequest, UpdateBusinessRequest } from '../../models';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonCheckbox,
  ],
  templateUrl: './business-form.page.html',
  styleUrl: './business-form.page.scss',
})
export class BusinessFormPage implements OnInit, OnDestroy {
  private readonly cityService = inject(CityService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly notify = inject(NotifyService);
    private readonly businessService = inject(BusinessService);
  private readonly destroy$ = new Subject<void>();

  businessForm!: FormGroup;
  businessId: string = '';
  isEditMode = false;
  loading = false;
  saving = false;

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
      mailOutline
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

          this.isCustomCategory = showCustom;
          this.customCategoryValue = showCustom ? business.category : '';

          // Habilitar ciudad si hay departamento
          if (business.department) {
            this.businessForm.get('city')?.enable();
          }

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

    this.ownerBusinessService
      .create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess('Negocio creado correctamente');
          this.isCustomCategory = false;
          this.customCategoryValue = '';
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

    this.ownerBusinessService
      .update(this.businessId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess('Negocio actualizado correctamente');
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
