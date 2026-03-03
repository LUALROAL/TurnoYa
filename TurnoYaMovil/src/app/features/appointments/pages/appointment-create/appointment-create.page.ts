import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, LOCALE_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  IonModal
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
  closeOutline
} from 'ionicons/icons';
import { debounceTime, distinctUntilChanged, Observable, of, Subject, switchMap, takeUntil, catchError, map, forkJoin } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { BusinessDetail, BusinessEmployeeItem, BusinessServiceItem } from '../../../business/models';
import { BusinessService } from '../../../business/services/business.service';
import { CreateAppointmentRequest } from '../../models';
import { AppointmentsService } from '../../services/appointments.service';
import { AvailabilityResponse } from '../../models/availability.models';

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
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonModal
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
  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected saving = false;
  protected business: BusinessDetail | null = null;
  protected services: BusinessServiceItem[] = [];
  protected employees: BusinessEmployeeItem[] = [];
  protected appointmentForm: FormGroup;

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
      closeOutline
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

    this.appointmentForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(() => this.loadAvailability())
      )
      .subscribe();

    // Suscripción a cambios en employeeId para recargar días disponibles
    this.appointmentForm.get('employeeId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.appointmentForm.get('serviceId')?.value) {
          this.loadAvailableDays();
        }
      });

    this.loadBusiness();
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
    this.appointmentsService.create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.saving = false;
          this.notify.showSuccess('Cita agendada correctamente');
          this.router.navigate(['/appointments']);
        },
        error: (err) => {
          this.saving = false;
          this.notify.showError('No se pudo agendar la cita. Intenta nuevamente.');
        }
      });
  }

  protected selectTime(time: string): void {
    this.appointmentForm.patchValue({ scheduledTime: this.getSlotStart(time) }, { emitEvent: false });
  }

  protected getSlotStart(slotLabel: string): string {
    return slotLabel.split(' - ')[0]?.trim() ?? slotLabel;
  }

  // ========== MÉTODOS DEL CALENDARIO ==========
  protected openCalendar(): void {
    this.isCalendarOpen = true;
    // Si no hay días cargados y hay servicio, cargar
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

    // 🔥 Forzar carga de horas para la nueva fecha
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

    const startDay = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Lunes, ...
    const startOffset = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDayOfMonth.getDate();

    const tempDays: { day: number; date: Date; isCurrentMonth: boolean; isSelectable: boolean }[] = [];

    // Días del mes anterior
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

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      tempDays.push({
        day,
        date,
        isCurrentMonth: true,
        isSelectable: this.isDateSelectable(date)
      });
    }

    // Completar hasta 42
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

    console.log('loadAvailableDays called', { serviceId, employeeId, businessId: this.businessId });

    if (!serviceId) {
      console.log('No serviceId, clearing days');
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

    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    console.log('Fetching available days from', from, 'to', to);

    this.loadingDays = true;

    this.appointmentsService
      .getAvailableDays(this.businessId, serviceId, from, to, employeeId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (days) => {
          console.log('Received available days:', days);
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
          this.services = business.services.filter(service => service.isActive);
          this.employees = business.employees.filter(employee => employee.isActive);
          this.configureBookingWindow(settings.bookingAdvanceDays ?? 30);
          this.loading = false;

          // Limpiar disponibilidad inicial
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

    return this.appointmentsService
      .getAvailability(this.businessId, serviceId, dateValue, employeeId || undefined)
      .pipe(
        takeUntil(this.destroy$),
        map((response: AvailabilityResponse) => {
          this.availableSlots = response.availableSlots;
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

  // Corregir getMinDate para evitar error de variable no encontrada
  protected getMinDate(): string {
    return this.minSelectableDate.toISOString().split('T')[0];
  }

  protected getMaxDate(): string {
    return this.maxSelectableDate.toISOString().split('T')[0];
  }

  private configureBookingWindow(maxAdvanceDays: number): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.minSelectableDate = new Date(today);
    this.minSelectableDate.setDate(this.minSelectableDate.getDate() + Math.max(maxAdvanceDays, 0));

    this.maxSelectableDate = new Date(today);
    this.maxSelectableDate.setDate(this.maxSelectableDate.getDate() + 365);
  }

  private isDateSelectable(date: Date): boolean {
    return this.isWithinBookingWindow(date) && this.availableDaysSet.has(this.formatDate(date));
  }

  private isWithinBookingWindow(date: Date): boolean {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);

    return normalized >= this.minSelectableDate && normalized <= this.maxSelectableDate;
  }
}
