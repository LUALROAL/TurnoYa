import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonAvatar,
  IonSelect,
  IonSelectOption, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  mailOutline,
  personOutline,
  callOutline,
  calendarOutline,
  lockClosedOutline,
  saveOutline,
  shieldOutline,
  syncOutline,
  checkmarkCircle,
  ellipseOutline,
  warningOutline,
  cameraOutline,
  closeOutline,
  imageOutline,
  trashOutline
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { UserService, } from '../../services/user.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppPhoto, PhotoService } from 'src/app/features/owner-business/services/photo.service';
import { UserProfileDto, UpdateUserProfileDto } from '../../models/user-profile.model';

type Tab = 'profile' | 'security';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonIcon,
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
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
  // Propiedades
  private readonly photoService = inject(PhotoService);
  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  existingPhotoBase64: string | null = null;
  constructor(
    private userService: UserService,
    private notify: NotifyService,
    private fb: FormBuilder,
    private router: Router,
    private authSession: AuthSessionService
  ) {
    addIcons({
      arrowBackOutline,
      mailOutline,
      personOutline,
      callOutline,
      calendarOutline,
      lockClosedOutline,
      saveOutline,
      shieldOutline,
      syncOutline,
      checkmarkCircle,
      ellipseOutline,
      warningOutline,
      cameraOutline,
      imageOutline,
      closeOutline,
      trashOutline
    });

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
        this.existingPhotoBase64 = profile.photoBase64 || null; // 👈 NUEVA LÍNEA
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
  const updateData: UpdateUserProfileDto = {};
  const form = this.profileForm.getRawValue();

  if (form.firstName !== this.profile()?.firstName) updateData.firstName = form.firstName;
  if (form.lastName !== this.profile()?.lastName) updateData.lastName = form.lastName;
  if (form.phoneNumber !== this.profile()?.phoneNumber) updateData.phoneNumber = form.phoneNumber;

  // Mapear género
  if (form.gender !== this.profile()?.gender) {
    let genderValue = form.gender;
    if (genderValue === 'Masculino') genderValue = 'M';
    else if (genderValue === 'Femenino') genderValue = 'F';
    else if (genderValue === 'Otro') genderValue = 'Other';
    updateData.gender = genderValue;
  }

  if (form.dateOfBirth !== this.profile()?.dateOfBirth) updateData.dateOfBirth = form.dateOfBirth;

  // Si no hay cambios y no hay foto nueva, no hacer nada
  if (Object.keys(updateData).length === 0 && !this.selectedPhotoFile) {
    this.updatingProfile.set(false);
    return;
  }

  // Usar el método con foto
  this.userService.updateProfileWithPhoto(updateData, this.selectedPhotoFile || undefined)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.existingPhotoBase64 = updated.photoBase64 || null;
        this.selectedPhotoFile = null;
        this.photoPreview = null;
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

  protected goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  protected logout(): void {
    this.authSession.clearSession();
    this.router.navigate(['/auth/login']);
  }

  // Métodos para foto
async takePhoto() {
  try {
    const photo = await this.photoService.takePhoto();
    await this.addPhotoToSelection(photo);
  } catch (error) {
    console.error('Error al tomar foto:', error);
    this.notify.showError('No se pudo tomar la foto');
  }
}

async selectFromGallery() {
  try {
    const photos = await this.photoService.selectImages();
    if (photos.length > 0) {
      await this.addPhotoToSelection(photos[0]);
    }
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    this.notify.showError('No se pudo seleccionar la imagen');
  }
}

private async addPhotoToSelection(photo: AppPhoto) {
  try {
    let file: File;
    if (photo.base64String) {
      file = this.base64ToFile(photo.base64String, `photo_${Date.now()}.jpg`, 'image/jpeg');
    } else if (photo.webPath) {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    } else {
      throw new Error('Formato de imagen no soportado');
    }
    this.selectedPhotoFile = file;
    this.photoPreview = photo.webPath || photo.base64String || null;
    this.existingPhotoBase64 = null; // Reemplazar foto existente
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    this.notify.showError('Error al procesar la imagen');
  }
}

removePhoto() {
  this.selectedPhotoFile = null;
  this.photoPreview = null;
  this.existingPhotoBase64 = null;
}

private base64ToFile(base64: string, filename: string, mimeType: string): File {
  if (base64.startsWith('data:')) {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mimeType });
  }
  const bstr = atob(base64);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mimeType });
}

}
