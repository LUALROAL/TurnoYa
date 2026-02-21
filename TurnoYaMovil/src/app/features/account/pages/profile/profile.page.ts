import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
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
  IonText,
  IonSelect,
  IonSelectOption,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { UserService, UserProfileDto } from '../../services/user.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/services/auth-session.service';

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
    IonSelectOption,
    IonBackButton,
    IonButtons
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
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
    private router: Router,
    private authSession: AuthSessionService
  ) {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    if (!this.authSession.hasValidSession()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/profile' },
      });
      return;
    }

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
    if (!this.authSession.hasValidSession()) {
      this.loading.set(false);
      return;
    }

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
          if (err?.status === 401) {
            this.loading.set(false);
            return;
          }
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
    // Mapear género a valores válidos para la base de datos
    if (form.gender !== this.profile()?.gender) {
      let genderValue = form.gender;
      // Si el valor es 'Masculino' o 'Femenino', mapear a 'M' o 'F'
      if (genderValue === 'Masculino') genderValue = 'M';
      else if (genderValue === 'Femenino') genderValue = 'F';
      else if (genderValue === 'Otro') genderValue = 'Other';
      updateData.gender = genderValue;
    }
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
