import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  IonButton,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { BusinessService } from '../../../core/services/business.service';
import { Category, CreateBusinessDto, UpdateBusinessDto } from '../../../core/models';

@Component({
  selector: 'app-business-form',
  templateUrl: './business-form.page.html',
  styleUrls: ['./business-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
    IonSelect,
    IonSelectOption,
    IonButton
  ]
})
export class BusinessFormPage implements OnInit {
  businessForm!: FormGroup;
  businessId: string | null = null;
  isEditMode = false;
  categories: Category[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.businessId;

    this.initializeForm();
    this.loadCategories();

    if (this.isEditMode && this.businessId) {
      this.loadBusiness();
    }
  }

  private initializeForm() {
    this.businessForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      department: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  loadCategories() {
    this.businessService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadBusiness() {
    if (!this.businessId) return;

    this.businessService.getBusinessById(this.businessId).subscribe({
      next: (response) => {
        const business = response.data;
        if (business) {
          this.businessForm.patchValue({
            name: business.name,
            description: business.description,
            category: business.category,
            address: business.address,
            city: business.city,
            department: business.department,
            phone: business.phone,
            email: business.email
          });
        }
      },
      error: async (error) => {
        await this.showToast('Error al cargar el negocio', 'danger');
        this.router.navigate(['/business/list']);
      }
    });
  }

  async onSubmit() {
    if (this.businessForm.invalid) {
      this.markFormGroupTouched(this.businessForm);
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando negocio...' : 'Creando negocio...'
    });
    await loading.present();

    const formData = this.businessForm.value;

    if (this.isEditMode && this.businessId) {
      const updateData: UpdateBusinessDto = formData;
      this.businessService.updateBusiness(this.businessId, updateData).subscribe({
        next: async (response) => {
          await loading.dismiss();
          await this.showToast('Negocio actualizado exitosamente', 'success');
          this.router.navigate(['/business/detail', this.businessId]);
        },
        error: async (error) => {
          await loading.dismiss();
          await this.showToast(error.message || 'Error al actualizar el negocio', 'danger');
        }
      });
    } else {
      const createData: CreateBusinessDto = formData;
      this.businessService.createBusiness(createData).subscribe({
        next: async (response) => {
          await loading.dismiss();
          await this.showToast('Negocio creado exitosamente', 'success');
          if (response.data?.id) {
            this.router.navigate(['/business/detail', response.data.id]);
          } else {
            this.router.navigate(['/business/list']);
          }
        },
        error: async (error) => {
          await loading.dismiss();
          await this.showToast(error.message || 'Error al crear el negocio', 'danger');
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
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

  get name() {
    return this.businessForm.get('name');
  }

  get description() {
    return this.businessForm.get('description');
  }

  get category() {
    return this.businessForm.get('category');
  }

  get address() {
    return this.businessForm.get('address');
  }

  get city() {
    return this.businessForm.get('city');
  }

  get department() {
    return this.businessForm.get('department');
  }

  get phone() {
    return this.businessForm.get('phone');
  }

  get email() {
    return this.businessForm.get('email');
  }
}
