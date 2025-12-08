import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSelect,
  IonSelectOption,
  IonIcon,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, UserRole } from '../../../core/models';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSelect,
    IonSelectOption
  ]
})
export class RegisterPage implements OnInit, AfterViewInit {
  registerForm!: FormGroup;
  isLoading = false;

  userRoles = [
    { value: UserRole.Customer, label: 'Cliente - Busco servicios para agendar citas' },
    { value: UserRole.BusinessOwner, label: 'Dueño de Negocio - Ofrezco servicios' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.initializeForm();
  }

  ngAfterViewInit() {
    this.setupInputStyles();
  }

  private initializeForm() {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        // Debe incluir minúscula, mayúscula, número y caracter especial
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      role: [UserRole.Customer, [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async onRegister() {
    if (this.registerForm.invalid || this.isLoading) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      cssClass: 'custom-loading',
      spinner: 'crescent'
    });
    await loading.present();

    // Enviar confirmPassword al backend (requerido por el validador)
    const request: RegisterRequest = this.registerForm.value;

    this.authService.register(request).subscribe({
      next: async (response) => {
        this.isLoading = false;
        await loading.dismiss();
        await this.showToast('¡Cuenta creada exitosamente! Bienvenido a TurnoYa', 'success');
        this.router.navigate(['/home']);
      },
      error: async (error) => {
        this.isLoading = false;
        await loading.dismiss();
        await this.showToast(error.message || 'Error al crear la cuenta', 'danger');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private setupInputStyles() {
    // Forzar estilos en inputs para prevenir problemas de autofill
    setTimeout(() => {
      const inputs = document.querySelectorAll('.custom-input');
      inputs.forEach(input => {
        // Asegurar que los inputs mantengan los estilos correctos
        const styleInput = (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.value) {
            target.style.color = '#ffffff';
            target.style.backgroundColor = 'transparent';
          }
        };

        input.addEventListener('input', styleInput);
        input.addEventListener('change', styleInput);
        input.addEventListener('blur', styleInput);

        // Verificar y aplicar estilos inmediatamente
        const htmlInput = input as HTMLInputElement;
        if (htmlInput.value) {
          htmlInput.style.color = '#ffffff';
          htmlInput.style.backgroundColor = 'transparent';
        }
      });
    }, 100);
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get phone() {
    return this.registerForm.get('phone');
  }

  get role() {
    return this.registerForm.get('role');
  }

  get passwordsMatch(): boolean {
    return !this.registerForm.hasError('passwordMismatch');
  }
}
