import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
  IonToggle,
  IonCheckbox,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { ServiceService } from '../../../core/services/service.service';
import { BusinessService } from '../../../core/services/business.service';
import { Employee } from '../../../core/models';

@Component({
  selector: 'app-service-form',
  templateUrl: './service-form.page.html',
  styleUrls: ['./service-form.page.scss'],
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
    IonInput,
    IonTextarea,
    IonButton,
    IonToggle,
    IonCheckbox
  ]
})
export class ServiceFormPage implements OnInit {
  form!: FormGroup;
  businessId = '';
  serviceId: string | null = null;
  title = 'Nuevo Servicio';
  isEditMode = false;
  employees: Employee[] = [];
  assignedEmployeeIds: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private serviceService: ServiceService,
    private businessService: BusinessService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.serviceId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.serviceId;

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      duration: [30, [Validators.required, Validators.min(5)]],
      price: [0, [Validators.required, Validators.min(0)]],
      currency: ['COP', Validators.required],
      isActive: [true]
    });

    if (this.isEditMode) {
      this.title = 'Editar Servicio';
      this.loadService();
      this.loadEmployees();
      this.loadAssignedEmployees();
    } else {
      this.title = 'Nuevo Servicio';
    }
  }

  get name() { return this.form.get('name'); }
  get duration() { return this.form.get('duration'); }
  get price() { return this.form.get('price'); }

  loadService() {
    if (!this.serviceId) return;

    this.serviceService.getById(this.serviceId).subscribe({
      next: (service) => {
        this.form.patchValue(service);
      },
      error: async () => {
        await this.showToast('Error al cargar el servicio', 'danger');
      }
    });
  }

  loadEmployees() {
    this.businessService.getBusinessById(this.businessId).subscribe({
      next: (response: any) => {
        const business = response?.data || response;
        this.employees = business.employees || [];
      }
    });
  }

  loadAssignedEmployees() {
    if (!this.serviceId) return;

    this.serviceService.getAssignedEmployees(this.serviceId).subscribe({
      next: (assigned) => {
        this.assignedEmployeeIds = assigned.map((e: any) => e.employeeId || e.id);
      }
    });
  }

  isEmployeeAssigned(employeeId: string): boolean {
    return this.assignedEmployeeIds.includes(employeeId);
  }

  toggleEmployee(employeeId: string, event: any) {
    if (event.detail.checked) {
      if (!this.assignedEmployeeIds.includes(employeeId)) {
        this.assignedEmployeeIds.push(employeeId);
      }
    } else {
      this.assignedEmployeeIds = this.assignedEmployeeIds.filter(id => id !== employeeId);
    }
  }

  async submit() {
    if (this.form.invalid) return;

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando...' : 'Creando...'
    });
    await loading.present();

    const data = {
      ...this.form.value,
      businessId: this.businessId
    };

    const obs = this.isEditMode && this.serviceId
      ? this.serviceService.update(this.serviceId, data)
      : this.serviceService.create(data);

    obs.subscribe({
      next: async (service) => {
        // Si es modo edición y hay empleados asignados, actualizar asignaciones
        if (this.isEditMode && this.assignedEmployeeIds.length > 0 && service.id) {
          await this.assignEmployees(service.id);
        }

        await loading.dismiss();
        await this.showToast('Guardado correctamente', 'success');
        this.router.navigate(['/business', this.businessId, 'services']);
      },
      error: async () => {
        await loading.dismiss();
        await this.showToast('Error al guardar', 'danger');
      }
    });
  }

  async assignEmployees(serviceId: string) {
    return new Promise((resolve) => {
      this.serviceService.assignEmployees(serviceId, this.assignedEmployeeIds).subscribe({
        next: () => resolve(true),
        error: () => resolve(false)
      });
    });
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
