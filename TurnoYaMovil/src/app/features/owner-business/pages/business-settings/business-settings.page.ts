import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  save,
  time,
  calendar,
  trash,
  businessOutline,
  timeOutline,
  syncOutline
} from 'ionicons/icons';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { BusinessSettings } from '../../models/business-settings.model';
// employees-related imports
import { OwnerEmployeesService } from '../../../owner-employees/services/owner-employees.service';
import { OwnerEmployee } from '../../../owner-employees/models';

@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonInput,
    RouterLink,
  ],
  templateUrl: './business-settings.page.html',
  styleUrls: ['./business-settings.page.scss'],
})
export class BusinessSettingsPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly ownerEmployeesService = inject(OwnerEmployeesService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  businessId: string = '';
  businessName: string = '';
  selectedTab: string = 'general'; // 'general' o 'schedule'

  // Formulario de ajustes generales
  settingsForm!: FormGroup;
  loadingSettings = false;
  savingSettings = false;

  // empleados para el tab de horarios
  employees: OwnerEmployee[] = [];
  loadingEmployees = false;
  isEmptyEmployees = false;

  // Para eliminar negocio
  deleting = false;

  // methode to load employees
  private loadEmployees(): void {
    this.loadingEmployees = true;
    this.ownerEmployeesService
      .getByBusinessId(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (emps: OwnerEmployee[]) => {
          this.employees = emps;
          this.isEmptyEmployees = emps.length === 0;
          this.loadingEmployees = false;
        },
        error: (err) => {
          console.error('Error al cargar empleados:', err);
          this.notify.showError('No se pudieron cargar los empleados del negocio');
          this.employees = [];
          this.isEmptyEmployees = true;
          this.loadingEmployees = false;
        },
      });
  }


  constructor() {
    addIcons({
      arrowBack,
      save,
      time,
      calendar,
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
        if (this.businessId) {
          this.loadEmployees();
        }
      }
    });

    if (this.businessId) {
      this.loadBusinessInfo();
      this.loadSettings();
      // schedule tab now shows empleados instead of horario
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
      bookingAdvanceDays: [0, [Validators.required, Validators.min(0), Validators.max(365)]],
      cancellationHours: [24, [Validators.required, Validators.min(0), Validators.max(168)]],
      bufferTimeBetweenAppointments: [15, [Validators.required, Validators.min(0), Validators.max(120)]],
      workingHours: [''],
    });
    // no necesitamos formulario de horarios en este componente
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

  // private loadSchedule() {
  //   this.loadingSchedule = true;
  //   this.ownerBusinessService
  //     .getSchedule(this.businessId)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (schedule) => {
  //         if (schedule) {
  //           // Normalizar: convertir null a string vacío
  //           const normalized: any = {};
  //           for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
  //             const dayData = schedule[day as keyof WorkingHoursDto] as DayScheduleDto;
  //             normalized[day] = {
  //               isOpen: dayData.isOpen,
  //               openTime: dayData.openTime || '',
  //               closeTime: dayData.closeTime || '',
  //               breakStartTime: dayData.breakStartTime || '',
  //               breakEndTime: dayData.breakEndTime || ''
  //             };
  //           }
  //           this.scheduleForm.patchValue(normalized);
  //           this.scheduleExists = true;
  //         } else {
  //           // Si no hay horario, permitir crear uno nuevo
  //           this.scheduleExists = false;
  //           this.resetScheduleForm();
  //         }
  //         this.loadingSchedule = false;
  //       },
  //       error: (error) => {
  //         if (error.status === 404) {
  //           this.scheduleExists = false;
  //           this.resetScheduleForm();
  //         } else {
  //           console.error('Error al cargar horarios:', error);
  //           this.notify.showError('Error al cargar los horarios del negocio');
  //         }
  //         this.loadingSchedule = false;
  //       },
  //     });
  // }

  // ya no se usa carga de horarios en este componente

  // método de respaldo de horarios eliminado ya que no se utiliza

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
    if (this.selectedTab === 'schedule' && this.businessId) {
      this.loadEmployees();
    }
  }

  protected trackByEmployeeId(_: number, employee: OwnerEmployee): string {
    return employee.id;
  }

  // Guardar ajustes generales
  onSaveSettings() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.notify.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.savingSettings = true;
    const rawSettings = this.settingsForm.value;
    const settings: BusinessSettings = {
      ...rawSettings,
      bookingAdvanceDays: Number(rawSettings.bookingAdvanceDays),
      cancellationHours: Number(rawSettings.cancellationHours),
      bufferTimeBetweenAppointments: Number(rawSettings.bufferTimeBetweenAppointments),
    };

    this.ownerBusinessService
      .updateSettings(this.businessId, settings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess('Configuración guardada correctamente');
          this.savingSettings = false;
          this.router.navigate(['/owner/businesses']);
        },
        error: (error) => {
          console.error('Error al guardar configuración:', error);
          this.notify.showError('Error al guardar la configuración');
          this.savingSettings = false;
        },
      });
  }

  // el manejo de horarios ya se realiza en otra pantalla de empleado; no se ocupa aquí

  // ya no es necesario validar horarios aquí
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
