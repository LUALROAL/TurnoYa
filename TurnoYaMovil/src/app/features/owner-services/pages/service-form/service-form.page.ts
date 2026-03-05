import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonPopover,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, save, peopleOutline, chevronDownOutline, closeOutline } from 'ionicons/icons';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { CreateServiceRequest, UpdateServiceRequest } from '../../models';
import { OwnerServicesService } from '../../services/owner-services.service';
import { OwnerEmployeesService } from '../../../owner-employees/services/owner-employees.service';
import { OwnerEmployee } from '../../../owner-employees/models';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonCheckbox,
    IonPopover,
  ],
  templateUrl: './service-form.page.html',
  styleUrl: './service-form.page.scss',
})
export class ServiceFormPage implements OnInit, OnDestroy {
  @ViewChild('employeesPopover') employeesPopover!: IonPopover;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerServicesService = inject(OwnerServicesService);
  private readonly ownerEmployeesService = inject(OwnerEmployeesService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  serviceForm!: FormGroup;
  businessId = '';
  serviceId = '';
  isEditMode = false;
  loading = false;
  saving = false;
  availableEmployees: OwnerEmployee[] = [];

  selectedEmployeeIds: string[] = [];
  private initialSelectedEmployeeIds: string[] = [];
  private closeTimeout: any;

  constructor() {
    addIcons({ arrowBack, save, peopleOutline, chevronDownOutline, closeOutline });
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
      this.loadBusinessEmployees();
    }

    this.serviceForm.get('employeeIds')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedEmployeeIds = value || [];
      });
  }

  ngOnDestroy(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
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
      employeeIds: [[]],
      isActive: [true],
    });
  }

  getSelectedEmployeesText(): string {
    if (this.selectedEmployeeIds.length === 0) {
      return 'Selecciona uno o más empleados';
    }

    if (this.selectedEmployeeIds.length === 1) {
      const employee = this.availableEmployees.find(e => e.id === this.selectedEmployeeIds[0]);
      return employee ? this.getEmployeeDisplayName(employee) : '1 empleado seleccionado';
    }

    return `${this.selectedEmployeeIds.length} empleados seleccionados`;
  }

  getEmployeeDisplayName(employee: OwnerEmployee): string {
    const firstName = employee.firstName?.trim() || '';
    const lastName = employee.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    if (employee.fullName?.trim()) {
      return employee.fullName.trim();
    }

    return 'Empleado sin nombre';
  }

  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployeeIds.includes(employeeId);
  }

  toggleEmployee(employeeId: string): void {
    const current = [...this.selectedEmployeeIds];
    const index = current.indexOf(employeeId);

    if (index === -1) {
      current.push(employeeId);
    } else {
      current.splice(index, 1);
    }

    this.selectedEmployeeIds = current;
    this.serviceForm.patchValue({ employeeIds: current }, { emitEvent: false });
  }

  async toggleEmployeesPopover(event: any) {
    this.employeesPopover.event = event;
    await this.employeesPopover.present();
  }

  closeEmployeesPopover() {
    this.employeesPopover.dismiss();
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

  private loadBusinessEmployees(): void {
    this.ownerEmployeesService
      .getByBusinessId(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: employees => {
          this.availableEmployees = employees;
          const assignedEmployeeIds = employees
            .filter(employee => (employee.serviceIds || []).includes(this.serviceId))
            .map(employee => employee.id);

          this.selectedEmployeeIds = [...assignedEmployeeIds];
          this.initialSelectedEmployeeIds = [...assignedEmployeeIds];
          this.serviceForm.patchValue({ employeeIds: assignedEmployeeIds }, { emitEvent: false });
        },
        error: (error: unknown) => {
          console.error('Error al cargar empleados del negocio:', error);
          this.notify.showError('No se pudieron cargar los empleados para este servicio');
        },
      });
  }

  private createService(): void {
    const formValue = this.serviceForm.value;

    const request: CreateServiceRequest = {
      name: formValue.name?.trim().toUpperCase(),
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
          this.notify.showSuccess('Servicio creado. Ahora agrega al menos un empleado para poder continuar.');
          // Redirigir a creación de empleado
          this.router.navigate(['/owner/businesses', this.businessId, 'employees', 'create']);
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
      name: formValue.name?.trim().toUpperCase() || undefined,
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
          this.syncServiceEmployees();
        },
        error: (error: unknown) => {
          console.error('Error al actualizar servicio:', error);
          this.notify.showError('No se pudo actualizar el servicio');
          this.saving = false;
        },
      });
  }

  private syncServiceEmployees(): void {
    if (!this.isEditMode) {
      this.saving = false;
      this.router.navigate(['/owner/businesses', this.businessId, 'services']);
      return;
    }

    const selectedSet = new Set(this.selectedEmployeeIds);
    const initialSet = new Set(this.initialSelectedEmployeeIds);

    const hasAssignmentChanges =
      selectedSet.size !== initialSet.size
      || [...selectedSet].some(id => !initialSet.has(id));

    if (!hasAssignmentChanges) {
      this.saving = false;
      this.router.navigate(['/owner/businesses', this.businessId, 'services']);
      return;
    }

    const updateRequests = this.availableEmployees
      .map(employee => {
        const currentServiceIds = employee.serviceIds || [];
        const currentlyAssigned = currentServiceIds.includes(this.serviceId);
        const shouldBeAssigned = selectedSet.has(employee.id);

        if (currentlyAssigned === shouldBeAssigned) {
          return null;
        }

        const nextServiceIds = shouldBeAssigned
          ? Array.from(new Set([...currentServiceIds, this.serviceId]))
          : currentServiceIds.filter(serviceId => serviceId !== this.serviceId);

        return this.ownerEmployeesService.update(employee.id, { serviceIds: nextServiceIds });
      })
      .filter((request): request is ReturnType<OwnerEmployeesService['update']> => request !== null);

    if (updateRequests.length === 0) {
      this.saving = false;
      this.router.navigate(['/owner/businesses', this.businessId, 'services']);
      return;
    }

    forkJoin(updateRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/owner/businesses', this.businessId, 'services']);
        },
        error: (error: unknown) => {
          console.error('Error al sincronizar empleados del servicio:', error);
          this.notify.showError('El servicio se actualizó, pero falló la asignación de empleados');
          this.saving = false;
        },
      });
  }

  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const insideEmployees = target.closest('.employees-container') !== null;

    if (insideEmployees) {
      return;
    }

    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    this.closeTimeout = setTimeout(() => {
      if (this.employeesPopover) {
        this.employeesPopover.dismiss();
      }
      this.closeTimeout = null;
    }, 200);
  }
}
