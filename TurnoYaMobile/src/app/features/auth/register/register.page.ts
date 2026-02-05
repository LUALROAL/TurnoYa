import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonSpinner,
  IonIcon,
  NavController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, UserRole } from '../../../core/models';
// Icons handled globally via main.ts

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonButton,
    IonSpinner,
    IonIcon
  ]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;

  userRoles = [
    { value: UserRole.Customer, label: 'Cliente (Reservar)' },
    { value: UserRole.BusinessOwner, label: 'Dueño (Ofrecer Servicios)' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private navController: NavController,
    private toastController: ToastController
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      role: [UserRole.Customer, [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() { }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    if (!password || !confirm) return null;
    return password.value === confirm.value ? null : { passwordMismatch: true };
  }

  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: RegisterRequest = this.registerForm.value;

    this.authService.register(request).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast('¡Cuenta creada exitosamente!', 'success');
        this.navController.navigateRoot('/home');
      },
      error: async (error) => {
        this.isLoading = false;
        await this.showToast(error.message || 'Error al registrarse', 'danger');
      }
    });
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goToLogin() {
    this.navController.navigateRoot('/login');
  }
}
