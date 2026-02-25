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
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  save,
  time,
  calendar,
  cash,
  trash,
  businessOutline,
  timeOutline,
  syncOutline
} from 'ionicons/icons';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { BusinessSettings } from '../../models';
import { WorkingHoursDto, DayScheduleDto } from '../../models/business-schedule.models';

@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonCheckbox,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  templateUrl: './business-settings.page.html',
  styleUrls: ['./business-settings.page.scss'],
})
export class BusinessSettingsPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  businessId: string = '';
  businessName: string = '';
  selectedTab: string = 'general'; // 'general' o 'schedule'

  // Formulario de ajustes generales
  settingsForm!: FormGroup;
  loadingSettings = false;
  savingSettings = false;

  // Formulario de horarios
  scheduleForm!: FormGroup;
  loadingSchedule = false;
  savingSchedule = false;
  scheduleExists = false;

  // Para eliminar negocio
  deleting = false;

  // Días para iterar en la plantilla
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
    addIcons({
      arrowBack,
      save,
      time,
      calendar,
      cash,
      trash,
      businessOutline,
      timeOutline,
      syncOutline
    });
    this.initForms();
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';

    // Leer query param para establecer la pestaña inicial
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'schedule') {
        this.selectedTab = 'schedule';
      }
    });

    if (this.businessId) {
      this.loadBusinessInfo();
      this.loadSettings();
      this.loadSchedule();
    } else {
      this.notify.showError('ID de negocio no válido');
      this.router.navigate(['/owner/businesses']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms() {
    // Formulario de ajustes generales
    this.settingsForm = this.fb.group({
      bookingAdvanceDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      cancellationHours: [24, [Validators.required, Validators.min(0), Validators.max(168)]],
      requiresDeposit: [false],
      noShowPolicy: [''],
      defaultSlotDuration: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      bufferTimeBetweenAppointments: [0, [Validators.required, Validators.min(0), Validators.max(120)]],
      workingHours: [''],
    });

    // Formulario de horarios
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

  private loadSettings() {
    this.loadingSettings = true;
    this.ownerBusinessService
      .getSettings(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settingsForm.patchValue(settings);
          this.loadingSettings = false;
        },
        error: (error) => {
          console.error('Error al cargar configuración:', error);
          this.notify.showError('Error al cargar la configuración del negocio');
          this.loadingSettings = false;
        },
      });
  }

  private loadSchedule() {
    this.loadingSchedule = true;
    this.ownerBusinessService
      .getSchedule(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedule) => {
          if (schedule) {
            // Normalizar: convertir null a string vacío
            const normalized: any = {};
            for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
              const dayData = schedule[day as keyof WorkingHoursDto] as DayScheduleDto;
              normalized[day] = {
                isOpen: dayData.isOpen,
                openTime: dayData.openTime || '',
                closeTime: dayData.closeTime || '',
                breakStartTime: dayData.breakStartTime || '',
                breakEndTime: dayData.breakEndTime || ''
              };
            }
            this.scheduleForm.patchValue(normalized);
            this.scheduleExists = true;
          } else {
            // Si no hay horario, permitir crear uno nuevo
            this.scheduleExists = false;
            this.resetScheduleForm();
          }
          this.loadingSchedule = false;
        },
        error: (error) => {
          if (error.status === 404) {
            this.scheduleExists = false;
            this.resetScheduleForm();
          } else {
            console.error('Error al cargar horarios:', error);
            this.notify.showError('Error al cargar los horarios del negocio');
          }
          this.loadingSchedule = false;
        },
      });
  }

  private resetScheduleForm() {
    const defaultWeekday = {
      isOpen: true,
      openTime: '09:00',
      closeTime: '18:00',
      breakStartTime: '13:00',
      breakEndTime: '14:00'
    };
    const defaultWeekend = {
      isOpen: false,
      openTime: '',
      closeTime: '',
      breakStartTime: '',
      breakEndTime: ''
    };
    this.scheduleForm.setValue({
      monday: defaultWeekday,
      tuesday: defaultWeekday,
      wednesday: defaultWeekday,
      thursday: defaultWeekday,
      friday: defaultWeekday,
      saturday: defaultWeekend,
      sunday: defaultWeekend
    });
  }

  private loadBusinessInfo() {
    this.ownerBusinessService
      .getById(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (business) => {
          this.businessName = business.name || '';
        },
        error: (error) => {
          console.error('Error al cargar negocio:', error);
        },
      });
  }

  // Cambio de pestaña
  onSegmentChange(event: any) {
    this.selectedTab = event.detail.value;
  }

  // Guardar ajustes generales
  onSaveSettings() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.notify.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.savingSettings = true;
    const settings: BusinessSettings = this.settingsForm.value;

    this.ownerBusinessService
      .updateSettings(this.businessId, settings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess('Configuración guardada correctamente');
          this.savingSettings = false;
        },
        error: (error) => {
          console.error('Error al guardar configuración:', error);
          this.notify.showError('Error al guardar la configuración');
          this.savingSettings = false;
        },
      });
  }

  // Guardar horarios
  onSaveSchedule() {
    if (!this.businessId) {
      this.notify.showError('No se encontró el ID del negocio.');
      return;
    }
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      this.notify.showError('Por favor, completa todos los horarios correctamente');
      return;
    }

    this.savingSchedule = true;
    const rawSchedule = this.scheduleForm.value;

    // Limpiar campos para días cerrados
    const cleanedSchedule: any = {};
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      const dayData = rawSchedule[day];
      cleanedSchedule[day] = {
        isOpen: dayData.isOpen,
        openTime: dayData.isOpen ? dayData.openTime : '',
        closeTime: dayData.isOpen ? dayData.closeTime : '',
        breakStartTime: dayData.isOpen && dayData.breakStartTime ? dayData.breakStartTime : '',
        breakEndTime: dayData.isOpen && dayData.breakEndTime ? dayData.breakEndTime : ''
      };
    }

    // Validar que las horas de inicio sean menores que las de fin
    if (!this.validateScheduleTimes(cleanedSchedule)) {
      this.notify.showError('Las horas de inicio deben ser menores que las de fin y el descanso debe estar dentro del horario laboral');
      this.savingSchedule = false;
      return;
    }
    console.log('Enviando schedule:', JSON.stringify(cleanedSchedule, null, 2));

    // Si no existe horario, crear (POST); si existe, actualizar (PUT)
    let request$;
    if (this.scheduleExists) {
      request$ = this.ownerBusinessService.updateSchedule(this.businessId, cleanedSchedule);
    } else {
      request$ = this.ownerBusinessService.createSchedule(this.businessId, cleanedSchedule);
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notify.showSuccess('Horarios guardados correctamente');
        this.scheduleExists = true;
        this.savingSchedule = false;
         this.router.navigate(['/owner/businesses']);
      },
      error: (error) => {
        console.error('Error al guardar horarios:', error);
        const message = error.error?.message || error.message || 'Error al guardar los horarios';
        this.notify.showError(message);
        this.savingSchedule = false;
      },
    });
  }

  private validateScheduleTimes(schedule: any): boolean {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
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
    this.router.navigate(['/owner/businesses']);
  }

  onDeleteBusiness() {
    if (this.deleting || this.savingSettings) return;

    const confirmed = confirm(
      'Vas a eliminar este negocio de forma permanente. Esta acción no se puede deshacer. ¿Deseas continuar?'
    );
    if (!confirmed) return;

    const expectedText = this.businessName?.trim() || 'ELIMINAR';
    const userInput = prompt(
      `Confirmación final: escribe exactamente "${expectedText}" para eliminar el negocio.`
    );

    if (!userInput || userInput.trim() !== expectedText) {
      this.notify.showError('Confirmación incorrecta. El negocio no fue eliminado.');
      return;
    }

    this.deleting = true;

    this.ownerBusinessService
      .delete(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.router.navigate(['/owner/businesses']);
        },
        error: (error) => {
          console.error('Error al eliminar negocio:', error);
          this.notify.showError('No se pudo eliminar el negocio');
          this.deleting = false;
        },
      });
  }

  get formControls() {
    return this.settingsForm.controls;
  }
}
