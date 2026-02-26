import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  save,
  syncOutline,
  timeOutline,
} from 'ionicons/icons';
import { OwnerEmployeesService } from '../../services/owner-employees.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { WorkingHoursDto, DayScheduleDto } from '../../models/employee-schedule.models';

@Component({
  selector: 'app-employee-schedule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonCheckbox,
  ],
  templateUrl: './employee-schedule.page.html',
  styleUrls: ['./employee-schedule.page.scss'],
})
export class EmployeeSchedulePage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeesService = inject(OwnerEmployeesService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  businessId = '';
  employeeId = '';
  employeeName = '';
  scheduleForm!: FormGroup;
  loading = false;
  saving = false;
  scheduleExists = false;

  days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  constructor() {
    addIcons({ arrowBack, save, syncOutline, timeOutline });
    this.initForm();
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.employeeId = this.route.snapshot.paramMap.get('employeeId') || '';

    if (!this.employeeId || !this.businessId) {
      this.notify.showError('Datos insuficientes para cargar el horario');
      this.router.navigate(['/owner/businesses']);
      return;
    }

    this.loadEmployeeInfo();
    this.loadSchedule();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.scheduleForm = this.fb.group({
      monday: this.createDayGroup(),
      tuesday: this.createDayGroup(),
      wednesday: this.createDayGroup(),
      thursday: this.createDayGroup(),
      friday: this.createDayGroup(),
      saturday: this.createDayGroup(),
      sunday: this.createDayGroup(),
    });
  }

  private createDayGroup(): FormGroup {
    return this.fb.group({
      isOpen: [true],
      openTime: ['09:00', [Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      closeTime: ['18:00', [Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      breakStartTime: ['13:00', [Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      breakEndTime: ['14:00', [Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    });
  }

  private loadEmployeeInfo() {
    this.employeesService
      .getById(this.employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee) => {
          this.employeeName = `${employee.firstName} ${employee.lastName}`;
        },
        error: (error) => {
          console.error('Error al cargar empleado:', error);
        },
      });
  }

  private loadSchedule() {
    this.loading = true;
    this.employeesService
      .getEmployeeSchedule(this.employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedule) => {
          if (schedule) {
            // Hay horario guardado
            const normalized: any = {};
            for (const day of this.days.map(d => d.key)) {
              const dayData = schedule[day as keyof WorkingHoursDto] as DayScheduleDto;
              normalized[day] = {
                isOpen: dayData.isOpen,
                openTime: dayData.openTime || '',
                closeTime: dayData.closeTime || '',
                breakStartTime: dayData.breakStartTime || '',
                breakEndTime: dayData.breakEndTime || '',
              };
            }
            this.scheduleForm.patchValue(normalized);
            this.scheduleExists = true;
          } else {
            // No existe horario
            this.scheduleExists = false;
            this.resetScheduleForm();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar horario:', error);
          this.notify.showError('Error al cargar el horario del empleado');
          this.loading = false;
        },
      });
  }

  private resetScheduleForm() {
    const defaultWeekday = {
      isOpen: true,
      openTime: '09:00',
      closeTime: '18:00',
      breakStartTime: '13:00',
      breakEndTime: '14:00',
    };
    const defaultWeekend = {
      isOpen: false,
      openTime: '',
      closeTime: '',
      breakStartTime: '',
      breakEndTime: '',
    };
    this.scheduleForm.setValue({
      monday: defaultWeekday,
      tuesday: defaultWeekday,
      wednesday: defaultWeekday,
      thursday: defaultWeekday,
      friday: defaultWeekday,
      saturday: defaultWeekend,
      sunday: defaultWeekend,
    });
  }

  onSave() {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      this.notify.showError('Por favor, completa todos los horarios correctamente');
      return;
    }

    this.saving = true;
    const rawSchedule = this.scheduleForm.value;

    // Limpiar campos para días cerrados
    const cleanedSchedule: any = {};
    for (const day of this.days.map(d => d.key)) {
      const dayData = rawSchedule[day];
      cleanedSchedule[day] = {
        isOpen: dayData.isOpen,
        openTime: dayData.isOpen ? dayData.openTime : '',
        closeTime: dayData.isOpen ? dayData.closeTime : '',
        breakStartTime: dayData.isOpen && dayData.breakStartTime ? dayData.breakStartTime : '',
        breakEndTime: dayData.isOpen && dayData.breakEndTime ? dayData.breakEndTime : '',
      };
    }

    // Validar que las horas de inicio sean menores que las de fin
    if (!this.validateScheduleTimes(cleanedSchedule)) {
      this.notify.showError('Las horas de inicio deben ser menores que las de fin y el descanso debe estar dentro del horario laboral');
      this.saving = false;
      return;
    }

    console.log('Enviando schedule:', JSON.stringify(cleanedSchedule, null, 2));

    const request$ = this.scheduleExists
      ? this.employeesService.updateEmployeeSchedule(this.employeeId, cleanedSchedule)
      : this.employeesService.createEmployeeSchedule(this.employeeId, cleanedSchedule);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notify.showSuccess('Horario guardado correctamente');
        this.saving = false;
        // Redirigir de vuelta a la lista de empleados del negocio
        this.router.navigate(['/owner/businesses', this.businessId, 'employees']);
      },
      error: (error) => {
        console.error('Error al guardar horario:', error);
        const message = error.error?.message || error.message || 'Error al guardar el horario';
        this.notify.showError(message);
        this.saving = false;
      },
    });
  }

  private validateScheduleTimes(schedule: any): boolean {
    for (const day of this.days.map(d => d.key)) {
      const dayData = schedule[day];
      if (dayData.isOpen) {
        if (dayData.openTime >= dayData.closeTime) {
          return false;
        }
        if (dayData.breakStartTime && dayData.breakEndTime) {
          if (dayData.breakStartTime >= dayData.breakEndTime) {
            return false;
          }
          if (dayData.breakStartTime < dayData.openTime || dayData.breakEndTime > dayData.closeTime) {
            return false;
          }
        }
      }
    }
    return true;
  }

  onCancel() {
    this.router.navigate(['/owner/businesses', this.businessId, 'employees']);
  }
}
