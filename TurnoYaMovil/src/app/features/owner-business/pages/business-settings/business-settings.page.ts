import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonCheckbox,
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, save, time, calendar, cash, trash } from 'ionicons/icons';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { BusinessSettings } from '../../models';

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
  ],
  templateUrl: './business-settings.page.html',
  styleUrl: './business-settings.page.scss',
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
  settingsForm!: FormGroup;
  loading = false;
  saving = false;
  deleting = false;

  constructor() {
    addIcons({ arrowBack, save, time, calendar, cash, trash });
    this.initForm();
  }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id') || '';
    if (this.businessId) {
      this.loadBusinessInfo();
      this.loadSettings();
    } else {
      this.notify.showError('ID de negocio no válido');
      this.router.navigate(['/owner/businesses']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.settingsForm = this.fb.group({
      bookingAdvanceDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      cancellationHours: [24, [Validators.required, Validators.min(0), Validators.max(168)]],
      requiresDeposit: [false],
      noShowPolicy: [''],
      defaultSlotDuration: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      bufferTimeBetweenAppointments: [0, [Validators.required, Validators.min(0), Validators.max(120)]],
      workingHours: [''],
    });
  }

  private loadSettings() {
    this.loading = true;
    this.ownerBusinessService
      .getSettings(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settingsForm.patchValue(settings);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar configuración:', error);
          this.notify.showError('Error al cargar la configuración del negocio');
          this.loading = false;
        },
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

  onSave() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.notify.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.saving = true;
    const settings: BusinessSettings = this.settingsForm.value;

    this.ownerBusinessService
      .updateSettings(this.businessId, settings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // NotifyService doesn't have showSuccess, using console for now
          console.log('Configuración guardada correctamente');
          this.saving = false;
          this.router.navigate(['/owner/businesses']);
        },
        error: (error) => {
          console.error('Error al guardar configuración:', error);
          this.notify.showError('Error al guardar la configuración');
          this.saving = false;
        },
      });
  }

  onCancel() {
    this.router.navigate(['/owner/businesses']);
  }

  onDeleteBusiness() {
    if (this.deleting || this.saving) {
      return;
    }

    const confirmed = confirm(
      'Vas a eliminar este negocio de forma permanente. Esta acción no se puede deshacer. ¿Deseas continuar?'
    );

    if (!confirmed) {
      return;
    }

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
