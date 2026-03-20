import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, LOCALE_ID, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonTextarea,
  IonSpinner,
  IonModal,
  IonPopover
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  calendarOutline,
  personOutline,
  save,
  timeOutline,
  warningOutline,
  chatbubbleOutline,
  syncOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  cutOutline,
  chevronDownOutline,
  briefcaseOutline
} from 'ionicons/icons';
import { debounceTime, distinctUntilChanged, Observable, of, Subject, switchMap, takeUntil, catchError, map, forkJoin } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { BusinessDetail, BusinessEmployeeItem, BusinessServiceItem } from '../../../business/models';
import { BusinessService } from '../../../business/services/business.service';
import { AppointmentItem, CreateAppointmentRequest } from '../../models';
import { AppointmentsService } from '../../services/appointments.service';
import { AvailabilityResponse } from '../../models/availability.models';
import { OwnerEmployeesService } from '../../../owner-employees/services/owner-employees.service';
import { EmployeeWorkingHoursDto } from '../../../owner-employees/models/employee-schedule.models';

// Registrar locale español
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [
    IonSpinner,
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonTextarea,
    IonModal,
    IonPopover
  ],
  templateUrl: './appointment-create.page.html',
  styleUrls: ['./appointment-create.page.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }]
})
export class AppointmentCreatePage implements OnInit, OnDestroy {
  // Getter público para acceder a los controles del formulario desde la plantilla
  get formControls() {
    return this.appointmentForm.controls;
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly businessService = inject(BusinessService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly notify = inject(NotifyService);
  private readonly employeesService = inject(OwnerEmployeesService);
  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected saving = false;
  protected business: BusinessDetail | null = null;
  protected services: BusinessServiceItem[] = [];
  protected employees: BusinessEmployeeItem[] = [];
  private allServices: BusinessServiceItem[] = [];
  protected allEmployees: BusinessEmployeeItem[] = [];
  protected appointmentForm: FormGroup;

  // Citas del cliente actual para validación de cruces
  protected clientAppointments: AppointmentItem[] = [];
  protected hasTimeClash = false;
  protected readonly APPOINTMENT_BUFFER_MINUTES = 15;

  // Fechas bloqueadas del empleado seleccionado
  protected blockedDatesForEmployee: string[] = [];

  // Disponibilidad (horas)
  protected availableSlots: string[] = [];
  protected loadingSlots = false;

  // Calendario
  protected isCalendarOpen = false;
  protected currentMonth: Date = new Date();
  protected calendarDays: { day: number; date: Date; isCurrentMonth: boolean; isSelectable: boolean }[] = [];
  protected weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  protected minSelectableDate: Date = new Date();
  protected maxSelectableDate: Date = new Date();

  // Días disponibles (con al menos un horario)
  protected availableDaysSet: Set<string> = new Set();
  protected loadingDays = false;

  // Referencias a los popovers
  @ViewChild('servicePopover') servicePopover!: IonPopover;
  @ViewChild('employeePopover') employeePopover!: IonPopover;

  constructor() {
    addIcons({
      arrowBack,
      calendarOutline,
      timeOutline,
      personOutline,
      save,
      warningOutline,
      chatbubbleOutline,
      syncOutline,
      chevronBackOutline,
      chevronForwardOutline,
      closeOutline,
      cutOutline,
      chevronDownOutline,
      briefcaseOutline
    });

    this.appointmentForm = this.fb.group({
      serviceId: ['', Validators.required],
      employeeId: [''],
      scheduledDate: ['', Validators.required],
      scheduledTime: ['', Validators.required],
      notes: ['', [Validators.maxLength(500)]],
    });

    this.generateCalendar();
  }

  ngOnInit(): void {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const preselectedService = params.get('serviceId');
      const preselectedEmployee = params.get('employeeId');
      if (preselectedService) {
        this.appointmentForm.patchValue({ serviceId: preselectedService }, { emitEvent: false });
      }
      if (preselectedEmployee) {
        this.appointmentForm.patchValue({ employeeId: preselectedEmployee }, { emitEvent: false });
      }
    });

    if (!this.businessId) {
      this.notify.showError('No se encontró el negocio');
      this.router.navigate(['/businesses']);
      return;
    }

    this.appointmentForm.get('scheduledDate')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(() => this.loadAvailability())
      )
      .subscribe();

    this.appointmentForm.get('serviceId')?.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applySelectionFilters('service');
        if (this.appointmentForm.get('serviceId')?.value) {
          this.loadAvailableDays();
        } else {
          this.availableDaysSet.clear();
          this.generateCalendar();
        }

        if (this.appointmentForm.get('scheduledDate')?.value || !this.appointmentForm.get('serviceId')?.value) {
          this.loadAvailability().pipe(takeUntil(this.destroy$)).subscribe();
        }
      });

    this.appointmentForm.get('employeeId')?.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applySelectionFilters('employee');
        if (this.appointmentForm.get('serviceId')?.value) {
          this.loadAvailableDays();
        }

        if (this.appointmentForm.get('scheduledDate')?.value) {
          this.loadAvailability().pipe(takeUntil(this.destroy$)).subscribe();
        }
      });

    this.loadBusiness();

    // Cargar citas del cliente para evitar cruces
    this.appointmentsService.getMy().pipe(takeUntil(this.destroy$)).subscribe({
      next: (appointments) => {
        this.clientAppointments = appointments.filter(a => {
          const status = String(a.status || '').toLowerCase();
          return status === 'pending' || status === 'confirmed' || status === '0' || status === '1';
        });
      },
      error: (err) => console.error('Error al cargar citas del cliente para validación:', err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onCancel(): void {
    this.router.navigate(['/businesses', this.businessId]);
  }

  protected onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.notify.showError('Completa los campos obligatorios para agendar la cita');
      return;
    }

    const formValue = this.appointmentForm.value;
    const scheduledDateTime = `${formValue.scheduledDate}T${formValue.scheduledTime}:00`;
    const scheduledDate = new Date(scheduledDateTime);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      this.notify.showError('La fecha y hora de la cita debe ser posterior al momento actual');
      return;
    }

    if (!this.isWithinBookingWindow(scheduledDate)) {
      this.notify.showError('La fecha seleccionada está fuera del rango permitido para reservar.');
      return;
    }

    const request: CreateAppointmentRequest = {
      businessId: this.businessId,
      serviceId: formValue.serviceId,
      employeeId: formValue.employeeId || undefined,
      scheduledDate: scheduledDateTime,
      notes: formValue.notes?.trim() || undefined,
    };

    this.saving = true;
    this.loadAvailability()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const selectedTime = formValue.scheduledTime as string;
          const stillAvailable = this.availableSlots.some(slot => this.getSlotStart(slot) === selectedTime);

          if (!stillAvailable) {
            this.saving = false;
            this.notify.showError('La hora seleccionada ya no está disponible. Elige otro horario.');
            return;
          }

          this.appointmentsService.create(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.saving = false;
                this.notify.showSuccess('Cita agendada correctamente');
                this.router.navigate(['/appointments']);
              },
              error: (err) => {
                this.saving = false;
                this.notify.showError(this.getCreateAppointmentErrorMessage(err));
              }
            });
        },
        error: () => {
          this.saving = false;
          this.notify.showError('No se pudo validar la disponibilidad. Intenta nuevamente.');
        }
      });
  }

  private getCreateAppointmentErrorMessage(error: unknown): string {
    const apiError = error as {
      status?: number;
      error?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };

    const scheduledDateErrors = apiError?.error?.errors?.['ScheduledDate'];
    if (Array.isArray(scheduledDateErrors) && scheduledDateErrors.length > 0) {
      const combinedMessage = scheduledDateErrors.join(' ');
      if (combinedMessage.toLowerCase().includes('futura')) {
        return 'La hora seleccionada ya pasó o no está disponible. Elige una hora futura.';
      }
      return combinedMessage;
    }

    const backendMessage = apiError?.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }

    if (apiError?.status === 409) {
      return 'El horario seleccionado ya fue tomado. Elige otro horario.';
    }

    return 'No se pudo agendar la cita. Intenta nuevamente.';
  }

  protected selectTime(time: string): void {
    this.appointmentForm.patchValue({ scheduledTime: this.getSlotStart(time) }, { emitEvent: false });
  }

  protected getSlotStart(slotLabel: string): string {
    return slotLabel.split(' - ')[0]?.trim() ?? slotLabel;
  }

  private filterSlotsByClientAppointments(slots: string[], serviceId: string, dateValue: string): string[] {
    if (!slots || slots.length === 0) {
      this.hasTimeClash = false;
      return [];
    }

    const service = this.services.find(s => s.id === serviceId);
    const durationMinutes = service?.duration || 0;
    const buffer = this.APPOINTMENT_BUFFER_MINUTES;

    this.hasTimeClash = false;

    const validSlots = slots.filter(slot => {
      const slotTime = this.getSlotStart(slot);
      const slotDate = new Date(`${dateValue}T${slotTime}:00`);

      if (Number.isNaN(slotDate.getTime())) return true;

      const slotStart = slotDate.getTime();
      const slotEnd = slotStart + durationMinutes * 60000;

      const hasClash = this.clientAppointments.some(appt => {
        const apptStart = new Date(appt.scheduledDate).getTime();
        // Fallback a calcular endDate si endpoint no incluyera endDate adecuadamente
        const safeApptEnd = appt.endDate ? new Date(appt.endDate).getTime() : apptStart + 30 * 60000;

        // Aplicamos buffer a la cita existente
        const protectedStart = apptStart - buffer * 60000;
        const protectedEnd = safeApptEnd + buffer * 60000;

        // Verificar intersección de rangos: [Start1, End1] cruza con [Start2, End2] si Start1 < End2 y End1 > Start2
        return (slotStart < protectedEnd && slotEnd > protectedStart);
      });

      if (hasClash) {
        this.hasTimeClash = true;
        return false;
      }
      return true;
    });

    return validSlots;
  }

  // ========== MÉTODOS DEL POPOVER ==========
  async openServicePopover(event: any) {
    this.servicePopover.event = event;
    await this.servicePopover.present();
  }

  selectService(service: BusinessServiceItem) {
    this.appointmentForm.patchValue({ serviceId: service.id });
    this.servicePopover.dismiss();
  }

  async openEmployeePopover(event: any) {
    this.employeePopover.event = event;
    await this.employeePopover.present();
  }

  selectEmployee(employeeId: string) {
    this.appointmentForm.patchValue({ employeeId });
    this.employeePopover.dismiss();
  }

  // Obtener nombre del servicio seleccionado
  getSelectedServiceName(): string {
    const serviceId = this.appointmentForm.get('serviceId')?.value;
    const service = this.services.find(s => s.id === serviceId);
    return service?.name || '';
  }

  // Obtener nombre del empleado seleccionado (o "Sin preferencia")
  getSelectedEmployeeName(): string {
    const employeeId = this.appointmentForm.get('employeeId')?.value;
    if (!employeeId) return 'Sin preferencia';
    const employee = this.employees.find(e => e.id === employeeId);
    return employee?.fullName || '';
  }

  // ========== MÉTODOS DEL CALENDARIO ==========
  protected openCalendar(): void {
    if (!this.appointmentForm.get('serviceId')?.value) {
      this.notify.showError('Debes seleccionar un servicio para ver las fechas disponibles.');
      return;
    }

    this.isCalendarOpen = true;
    if (!this.loadingDays && this.availableDaysSet.size === 0 && this.appointmentForm.get('serviceId')?.value) {
      this.loadAvailableDays();
    }
  }

  protected closeCalendar(): void {
    this.isCalendarOpen = false;
  }

  protected prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
    if (this.appointmentForm.get('serviceId')?.value) {
      this.loadAvailableDays();
    }
  }

  protected nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
    if (this.appointmentForm.get('serviceId')?.value) {
      this.loadAvailableDays();
    }
  }

  protected selectDate(day: number, monthOffset: number = 0): void {
    const selectedDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + monthOffset, day);
    if (!this.isWithinBookingWindow(selectedDate)) return;

    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    this.appointmentForm.patchValue({ scheduledDate: dateStr }, { emitEvent: false });

    this.loadAvailability().pipe(takeUntil(this.destroy$)).subscribe();

    this.closeCalendar();
  }

  protected formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  protected isSelectedDate(day: number, monthOffset: number = 0): boolean {
    const selected = this.appointmentForm.get('scheduledDate')?.value;
    if (!selected) return false;

    const [year, month, dayStr] = selected.split('-').map(Number);
    const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + monthOffset, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  private generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay();
    const startOffset = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDayOfMonth.getDate();

    const tempDays: { day: number; date: Date; isCurrentMonth: boolean; isSelectable: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      tempDays.push({
        day,
        date,
        isCurrentMonth: false,
        isSelectable: this.isDateSelectable(date)
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      tempDays.push({
        day,
        date,
        isCurrentMonth: true,
        isSelectable: this.isDateSelectable(date)
      });
    }

    const remaining = 42 - tempDays.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      tempDays.push({
        day,
        date,
        isCurrentMonth: false,
        isSelectable: this.isDateSelectable(date)
      });
    }

    this.calendarDays = tempDays;
  }

  private loadAvailableDays(): void {
    const serviceId = this.appointmentForm.get('serviceId')?.value;
    const employeeId = this.appointmentForm.get('employeeId')?.value;

    if (!serviceId) {
      this.availableDaysSet.clear();
      this.generateCalendar();
      return;
    }

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const fromDate = firstDay < this.minSelectableDate ? this.minSelectableDate : firstDay;
    const toDate = lastDay > this.maxSelectableDate ? this.maxSelectableDate : lastDay;

    if (fromDate > toDate) {
      this.availableDaysSet.clear();
      this.generateCalendar();
      this.loadingDays = false;
      return;
    }

    const from = this.toLocalDateString(fromDate);
    const to = this.toLocalDateString(toDate);

    this.loadingDays = true;

    if (!employeeId) {
      const associatedEmployeeIds = this.allEmployees
        .filter(employee => employee.isActive && (employee.serviceIds ?? []).includes(serviceId))
        .map(employee => employee.id);

      if (associatedEmployeeIds.length === 0) {
        this.availableDaysSet.clear();
        this.generateCalendar();
        this.loadingDays = false;
        return;
      }

      const availableDaysRequests = associatedEmployeeIds.map(id =>
        this.appointmentsService
          .getAvailableDays(this.businessId, serviceId, from, to, id)
          .pipe(catchError(() => of([] as string[])))
      );

      forkJoin(availableDaysRequests)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (daysByEmployee: string[][]) => {
            const mergedDays: string[] = daysByEmployee.reduce((acc: string[], days: string[]) => {
              return acc.concat(days);
            }, []);
            this.availableDaysSet = new Set<string>(mergedDays);
            this.generateCalendar();
            this.loadingDays = false;
          },
          error: (err) => {
            console.error('Error al cargar días disponibles sin preferencia', err);
            this.availableDaysSet.clear();
            this.generateCalendar();
            this.loadingDays = false;
          }
        });

      return;
    }

    this.appointmentsService
      .getAvailableDays(this.businessId, serviceId, from, to, employeeId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (days) => {
          this.availableDaysSet = new Set(days);
          this.generateCalendar();
          this.loadingDays = false;
        },
        error: (err) => {
          console.error('Error al cargar días disponibles', err);
          this.availableDaysSet.clear();
          this.generateCalendar();
          this.loadingDays = false;
        }
      });
  }

  private loadBusiness(): void {
    this.loading = true;

    forkJoin({
      business: this.businessService.getById(this.businessId),
      settings: this.businessService.getSettings(this.businessId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ business, settings }: { business: BusinessDetail; settings: { bookingAdvanceDays: number } }) => {
          this.business = business;
          this.allServices = business.services.filter(service => service.isActive);
          this.allEmployees = business.employees.filter(employee => employee.isActive);
          this.services = [...this.allServices];
          this.employees = [...this.allEmployees];
          this.applySelectionFilters();
          this.configureBookingWindow(settings.bookingAdvanceDays ?? 0);
          this.loading = false;

          this.availableDaysSet.clear();
          this.generateCalendar();
        },
        error: (error: unknown) => {
          console.error('Error al cargar negocio:', error);
          this.notify.showError('No se pudo cargar la información del negocio');
          this.loading = false;
          this.router.navigate(['/businesses']);
        },
      });
  }

  private applySelectionFilters(changedBy?: 'service' | 'employee'): void {
    const selectedServiceId = this.appointmentForm.get('serviceId')?.value as string;
    const selectedEmployeeId = this.appointmentForm.get('employeeId')?.value as string;

    if (selectedEmployeeId) {
      this.loadBlockedDates(selectedEmployeeId);
      const selectedEmployee = this.allEmployees.find(employee => employee.id === selectedEmployeeId);
      const assignedServiceIds = selectedEmployee?.serviceIds ?? [];
      this.services = this.allServices.filter(service => assignedServiceIds.includes(service.id));
    } else {
      this.services = [...this.allServices];
      this.blockedDatesForEmployee = [];
    }

    if (selectedServiceId) {
      this.employees = this.allEmployees.filter(employee => (employee.serviceIds ?? []).includes(selectedServiceId));
    } else {
      this.employees = [...this.allEmployees];
    }

    if (selectedServiceId && !this.services.some(service => service.id === selectedServiceId)) {
      this.appointmentForm.patchValue(
        { serviceId: '', scheduledDate: '', scheduledTime: '' },
        { emitEvent: false }
      );
      this.availableSlots = [];
      if (changedBy === 'employee') {
        this.notify.showError('El servicio seleccionado no está asignado al profesional elegido.');
      }
    }

    if (selectedEmployeeId && !this.employees.some(employee => employee.id === selectedEmployeeId)) {
      this.appointmentForm.patchValue(
        { employeeId: '', scheduledDate: '', scheduledTime: '' },
        { emitEvent: false }
      );
      this.availableSlots = [];
      if (changedBy === 'service') {
        this.notify.showError('El profesional seleccionado no atiende el servicio elegido.');
      }
    }
  }

  private loadAvailability(): Observable<void> {
    const serviceId = this.appointmentForm.get('serviceId')?.value;
    const dateValue = this.appointmentForm.get('scheduledDate')?.value;
    const employeeId = this.appointmentForm.get('employeeId')?.value;

    if (!serviceId || !dateValue) {
      this.availableSlots = [];
      this.appointmentForm.get('scheduledTime')?.disable({ emitEvent: false });
      return of(undefined);
    }

    this.loadingSlots = true;
    this.appointmentForm.get('scheduledTime')?.disable({ emitEvent: false });

    if (!employeeId) {
      const associatedEmployeeIds = this.allEmployees
        .filter(employee => employee.isActive && (employee.serviceIds ?? []).includes(serviceId))
        .map(employee => employee.id);

      if (associatedEmployeeIds.length === 0) {
        this.availableSlots = [];
        this.appointmentForm.patchValue({ scheduledTime: '' }, { emitEvent: false });
        this.loadingSlots = false;
        return of(undefined);
      }

      const availabilityRequests = associatedEmployeeIds.map(id =>
        this.appointmentsService
          .getAvailability(this.businessId, serviceId, dateValue, id)
          .pipe(catchError(() => of({ date: dateValue, availableSlots: [] } as AvailabilityResponse)))
      );

      return forkJoin(availabilityRequests).pipe(
        takeUntil(this.destroy$),
        map((responses: AvailabilityResponse[]) => {
          const mergedSlots: string[] = responses.reduce((acc: string[], response: AvailabilityResponse) => {
            return acc.concat(response.availableSlots);
          }, []);
          const rawSlots = Array.from(new Set<string>(mergedSlots)).sort((a: string, b: string) =>
            this.getSlotStart(a).localeCompare(this.getSlotStart(b))
          );

          this.availableSlots = this.filterSlotsByClientAppointments(rawSlots, serviceId, dateValue);

          const selectedTime = this.appointmentForm.get('scheduledTime')?.value;
          if (this.availableSlots.length === 0 || !this.availableSlots.includes(selectedTime)) {
            this.appointmentForm.patchValue({ scheduledTime: '' }, { emitEvent: false });
          }

          if (this.availableSlots.length === 0) {
            this.appointmentForm.get('scheduledTime')?.disable({ emitEvent: false });
          } else {
            this.appointmentForm.get('scheduledTime')?.enable({ emitEvent: false });
          }

          this.loadingSlots = false;
          return undefined;
        }),
        catchError((error) => {
          console.error('Error al cargar disponibilidad sin preferencia:', error);
          this.availableSlots = [];
          this.appointmentForm.get('scheduledTime')?.disable({ emitEvent: false });
          this.loadingSlots = false;
          return of(undefined);
        })
      );
    }

    return this.appointmentsService
      .getAvailability(this.businessId, serviceId, dateValue, employeeId || undefined)
      .pipe(
        takeUntil(this.destroy$),
        map((response: AvailabilityResponse) => {
          this.availableSlots = this.filterSlotsByClientAppointments(response.availableSlots, serviceId, dateValue);
          if (this.availableSlots.length === 0) {
            this.appointmentForm.get('scheduledTime')?.disable({ emitEvent: false });
            this.appointmentForm.patchValue({ scheduledTime: '' }, { emitEvent: false });
          } else {
            this.appointmentForm.get('scheduledTime')?.enable({ emitEvent: false });
          }
          this.loadingSlots = false;
          return undefined;
        }),
        catchError((error) => {
          console.error('Error al cargar disponibilidad:', error);
          this.availableSlots = [];
          this.appointmentForm.get('scheduledTime')?.disable({ emitEvent: false });
          this.loadingSlots = false;
          return of(undefined);
        })
      );
  }

  protected getMinDate(): string {
    return this.toLocalDateString(this.minSelectableDate);
  }

  protected getMaxDate(): string {
    return this.toLocalDateString(this.maxSelectableDate);
  }

  private configureBookingWindow(minAdvanceDays: number): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedMinAdvance = Number(minAdvanceDays);
    const safeMinAdvance = Number.isFinite(parsedMinAdvance)
      ? Math.max(Math.trunc(parsedMinAdvance), 0)
      : 0;

    this.minSelectableDate = new Date(today);
    this.minSelectableDate.setDate(this.minSelectableDate.getDate() + safeMinAdvance);

    this.maxSelectableDate = new Date(today);
    this.maxSelectableDate.setDate(this.maxSelectableDate.getDate() + 365);
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isDateSelectable(date: Date): boolean {
    return this.isWithinBookingWindow(date) && this.availableDaysSet.has(this.formatDate(date)) && !this.blockedDatesForEmployee.includes(this.formatDate(date));
  }

  private loadBlockedDates(employeeId: string): void {
    this.employeesService
      .getEmployeeSchedule(employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedule: EmployeeWorkingHoursDto | null) => {
          this.blockedDatesForEmployee = schedule?.blockedDates || [];
          this.generateCalendar();
        },
        error: (error) => {
          console.error('Error al cargar fechas bloqueadas:', error);
          this.blockedDatesForEmployee = [];
        },
      });
  }

  private isWithinBookingWindow(date: Date): boolean {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);

    return normalized >= this.minSelectableDate && normalized <= this.maxSelectableDate;
  }
}
