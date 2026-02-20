import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner, IonSegment, IonSegmentButton, IonAvatar, IonText, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { UserService, UserProfileDto } from '../../services/user.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { Router } from '@angular/router';

type Tab = 'profile' | 'security';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonAvatar,
    IonSelect,
    IonSelectOption
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center h-full">
        <ion-spinner></ion-spinner>
      </div>

      <!-- Profile Content -->
      <div *ngIf="!loading()">
        <!-- Tab Navigation -->
        <ion-segment [value]="activeTab" (ionChange)="onTabChange($event.detail.value)" class="mb-4">
          <ion-segment-button value="profile">Información Personal</ion-segment-button>
          <ion-segment-button value="security">Seguridad</ion-segment-button>
        </ion-segment>

        <!-- Profile Tab -->
        <div *ngIf="activeTab === 'profile'">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Información Personal</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <!-- Avatar -->
              <div class="flex justify-center mb-6">
                <ion-avatar class="w-20 h-20">
                  <img [src]="profile()?.photoUrl || 'assets/default-avatar.png'" alt="Foto de perfil" />
                </ion-avatar>
              </div>

              <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
                <!-- Email (Read-only) -->
                <ion-item>
                  <ion-label position="floating">Email</ion-label>
                  <ion-input [value]="profile()?.email" readonly></ion-input>
                </ion-item>

                <!-- First Name -->
                <ion-item>
                  <ion-label position="floating">Nombre</ion-label>
                  <ion-input formControlName="firstName" type="text" placeholder="Tu nombre"></ion-input>
                </ion-item>

                <!-- Last Name -->
                <ion-item>
                  <ion-label position="floating">Apellido</ion-label>
                  <ion-input formControlName="lastName" type="text" placeholder="Tu apellido"></ion-input>
                </ion-item>

                <!-- Phone -->
                <ion-item>
                  <ion-label position="floating">Teléfono</ion-label>
                  <ion-input formControlName="phoneNumber" type="tel" placeholder="Tu teléfono"></ion-input>
                </ion-item>

                <!-- Gender -->
                <ion-item>
                  <ion-label position="floating">Género</ion-label>
                  <ion-select formControlName="gender">
                    <ion-select-option value="">Seleccionar</ion-select-option>
                    <ion-select-option value="M">Masculino</ion-select-option>
                    <ion-select-option value="F">Femenino</ion-select-option>
                    <ion-select-option value="Other">Otro</ion-select-option>
                  </ion-select>
                </ion-item>

                <!-- Date of Birth -->
                <ion-item>
                  <ion-label position="floating">Fecha de Nacimiento</ion-label>
                  <ion-input formControlName="dateOfBirth" type="date"></ion-input>
                </ion-item>

                <!-- Profile Stats -->
                <div class="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                      <p class="text-2xl font-bold">{{ profile()?.completedAppointments }}</p>
                      <p class="text-sm text-gray-600">Citas Completadas</p>
                    </div>
                    <div class="text-center">
                      <p class="text-2xl font-bold">{{ profile()?.averageRating?.toFixed(1) }}</p>
                      <p class="text-sm text-gray-600">Calificación</p>
                    </div>
                  </div>
                </div>

                <!-- Update Button -->
                <div class="mt-6">
                  <ion-button [disabled]="updatingProfile() || !profileForm.valid" expand="block" (click)="onUpdateProfile()">
                    <ion-spinner *ngIf="updatingProfile()" name="dots"></ion-spinner>
                    <span *ngIf="!updatingProfile()">Actualizar Perfil</span>
                  </ion-button>
                </div>
              </form>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Security Tab -->
        <div *ngIf="activeTab === 'security'">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Cambiar Contraseña</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
                <!-- Current Password -->
                <ion-item>
                  <ion-label position="floating">Contraseña Actual</ion-label>
                  <ion-input formControlName="currentPassword" type="password" placeholder="Contraseña actual"></ion-input>
                </ion-item>

                <!-- New Password -->
                <ion-item>
                  <ion-label position="floating">Contraseña Nueva</ion-label>
                  <ion-input formControlName="newPassword" type="password" placeholder="Contraseña nueva"></ion-input>
                </ion-item>

                <!-- Confirm Password -->
                <ion-item>
                  <ion-label position="floating">Confirmar Contraseña</ion-label>
                  <ion-input formControlName="confirmPassword" type="password" placeholder="Confirma la contraseña"></ion-input>
                </ion-item>

                <!-- Password Requirements -->
                <div class="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p class="font-semibold mb-2">Requisitos:</p>
                  <ul class="list-disc list-inside space-y-1 text-xs">
                    <li [class.line-through]="passwordForm.get('newPassword')?.value?.length >= 8" [class.text-green-600]="passwordForm.get('newPassword')?.value?.length >= 8">Mínimo 8 caracteres</li>
                    <li [class.line-through]="hasUpperCase()" [class.text-green-600]="hasUpperCase()">Una mayúscula</li>
                    <li [class.line-through]="hasLowerCase()" [class.text-green-600]="hasLowerCase()">Una minúscula</li>
                    <li [class.line-through]="hasDigit()" [class.text-green-600]="hasDigit()">Un dígito</li>
                  </ul>
                </div>

                <!-- Change Password Button -->
                <div class="mt-6">
                  <ion-button [disabled]="changingPassword() || !passwordForm.valid" expand="block" (click)="onChangePassword()">
                    <ion-spinner *ngIf="changingPassword()" name="dots"></ion-spinner>
                    <span *ngIf="!changingPassword()">Cambiar Contraseña</span>
                  </ion-button>
                </div>
              </form>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-padding: 1rem;
    }

    ion-select-option {
      background: white;
    }

    .line-through {
      text-decoration: line-through;
    }

    .text-green-600 {
      color: #16a34a;
    }
  `]
})
export class ProfilePage implements OnInit, OnDestroy {
  protected profile = signal<UserProfileDto | null>(null);
  protected loading = signal(true);
  protected updatingProfile = signal(false);
  protected changingPassword = signal(false);
  protected activeTab: Tab = 'profile';

  protected profileForm: FormGroup;
  protected passwordForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private notify: NotifyService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onTabChange(value: any): void {
    this.activeTab = value as Tab;
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.userService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.populateProfileForm(profile);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar perfil:', err);
          this.notify.showError('No se pudo cargar el perfil');
          this.loading.set(false);
        }
      });
  }

  private createProfileForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      phoneNumber: ['', [Validators.maxLength(15)]],
      gender: [''],
      dateOfBirth: ['']
    });
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, { validators: this.passwordsMatch.bind(this) });
  }

  private populateProfileForm(profile: UserProfileDto): void {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phoneNumber || '',
      gender: profile.gender || '',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''
    });
  }

  protected onUpdateProfile(): void {
    if (!this.profileForm.valid) {
      this.notify.showError('Por favor completa todos los campos requeridos');
      return;
    }

    this.updatingProfile.set(true);
    const updateData: any = {};
    const form = this.profileForm.getRawValue();

    // Solo incluir cambios
    if (form.firstName !== this.profile()?.firstName) updateData.firstName = form.firstName;
    if (form.lastName !== this.profile()?.lastName) updateData.lastName = form.lastName;
    if (form.phoneNumber !== this.profile()?.phoneNumber) updateData.phoneNumber = form.phoneNumber;
    if (form.gender !== this.profile()?.gender) updateData.gender = form.gender;
    if (form.dateOfBirth !== this.profile()?.dateOfBirth) updateData.dateOfBirth = form.dateOfBirth;

    if (Object.keys(updateData).length === 0) {
      this.updatingProfile.set(false);
      return;
    }

    this.userService
      .updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.notify.showSuccess('Perfil actualizado correctamente');
          this.updatingProfile.set(false);
        },
        error: (err) => {
          console.error('Error al actualizar perfil:', err);
          this.notify.showError(err.error?.detail || 'Error al actualizar el perfil');
          this.updatingProfile.set(false);
        }
      });
  }

  protected onChangePassword(): void {
    if (!this.passwordForm.valid) {
      this.notify.showError('Por favor completa todos los campos');
      return;
    }

    const changeData = this.passwordForm.getRawValue();

    // Validación adicional
    if (changeData.newPassword === changeData.currentPassword) {
      this.notify.showError('La contraseña nueva debe ser diferente de la actual');
      return;
    }

    if (changeData.newPassword !== changeData.confirmPassword) {
      this.notify.showError('Las contraseñas no coinciden');
      return;
    }

    this.changingPassword.set(true);
    this.userService
      .changePassword(changeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess('Contraseña cambiada correctamente');
          this.passwordForm.reset();
          this.changingPassword.set(false);
        },
        error: (err) => {
          console.error('Error al cambiar contraseña:', err);
          this.notify.showError(err.error?.detail || 'Error al cambiar la contraseña');
          this.changingPassword.set(false);
        }
      });
  }

  protected hasUpperCase(): boolean {
    const pwd = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(pwd);
  }

  protected hasLowerCase(): boolean {
    const pwd = this.passwordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(pwd);
  }

  protected hasDigit(): boolean {
    const pwd = this.passwordForm.get('newPassword')?.value || '';
    return /[0-9]/.test(pwd);
  }

  private passwordsMatch(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }
}
