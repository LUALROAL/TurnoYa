import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonButton,
  IonToggle,
  IonSelect,
  IonSelectOption,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { BusinessService } from '../../../core/services/business.service';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.page.html',
  styleUrls: ['./employee-form.page.scss'],
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
    IonInput,
    IonButton,
    IonToggle,
    IonSelect,
    IonSelectOption
  ]
})
export class EmployeeFormPage implements OnInit {
  form!: FormGroup;
  businessId = '';
  employeeId: string | null = null;
  title = 'Nuevo Empleado';

  roleOptions = [
    { value: 'Employee', label: 'Empleado' },
    { value: 'Manager', label: 'Gerente' },
    { value: 'Specialist', label: 'Especialista' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.employeeId = this.route.snapshot.paramMap.get('id');

    this.form = this.fb.group({
      userId: ['', Validators.required],
      role: ['Employee', Validators.required],
      isActive: [true]
    });

    if (this.employeeId) {
      this.title = 'Editar Empleado';
      this.loadEmployee();
    }
  }

  loadEmployee() {
    this.businessService.getBusinessEmployees(this.businessId).subscribe({
      next: (data: any) => {
        const employees = Array.isArray(data) ? data : ((data as any)?.data || []);
        const employee = employees.find((e: any) => e.id === this.employeeId);

        if (employee) {
          this.form.patchValue({
            userId: employee.userId,
            role: employee.role,
            isActive: employee.isActive
          });
          // En modo edición, el userId no debe ser editable
          this.form.get('userId')?.disable();
        }
      },
      error: async (err) => {
        const toast = await this.toastController.create({
          message: 'Error al cargar empleado',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async submit() {
    if (this.form.invalid) {
      const toast = await this.toastController.create({
        message: 'Por favor completa todos los campos requeridos',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: this.employeeId ? 'Actualizando...' : 'Creando...'
    });
    await loading.present();

    const formValue = this.form.getRawValue(); // getRawValue incluye campos disabled

    const operation = this.employeeId
      ? this.businessService.updateEmployee(this.employeeId, {
          role: formValue.role,
          isActive: formValue.isActive
        })
      : this.businessService.createEmployee(this.businessId, formValue);

    operation.subscribe({
      next: async () => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: this.employeeId ? 'Empleado actualizado' : 'Empleado creado',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.router.navigate(['/business', this.businessId, 'employees']);
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.message || 'Error al guardar empleado',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}
