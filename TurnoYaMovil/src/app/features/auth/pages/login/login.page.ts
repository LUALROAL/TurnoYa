import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { IonicModule, ToastController } from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  calendarNumberOutline,
  mailOutline,
  alertCircleOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkOutline,
  helpCircleOutline,
  warningOutline,
  syncOutline,
  arrowForwardOutline,
  logoGoogle,
  informationCircleOutline
} from "ionicons/icons";

import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
})
export class LoginPage {
  constructor(private toastController: ToastController) {
    addIcons({
      calendarNumberOutline,
      mailOutline,
      alertCircleOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkOutline,
      helpCircleOutline,
      warningOutline,
      syncOutline,
      arrowForwardOutline,
      logoGoogle,
      informationCircleOutline
    });
  }

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);


  protected readonly form = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  protected loading = false;
  protected googleLoading = false;
  protected showPassword = false;
  protected errorMessage = '';

  // Bandera para prevenir race condition en Google Web
  private googleAuthInProgress = false;

  protected togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Maneja el cambio del checkbox de recordar acceso
   */
  protected onRememberMeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.form.get('rememberMe')?.setValue(target.checked);
  }

  /**
   * Maneja el cambio del checkbox de términos
   */
  protected onAcceptTermsChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.form.get('acceptTerms')?.setValue(target.checked);
  }

  protected submit() {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();
    if (!email || !password) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.authService.login(email, password, rememberMe ?? false).subscribe({
      next: response => {
        this.loading = false;
        // Obtener returnUrl del query param o usar ruta según el rol
        const returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || this.authService.getRouteByRole(response.user.role);
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.loading = false;
        // Mostrar mensaje de error específico según el tipo de error
        const errorMessage = error.error?.message?.toLowerCase() || '';
        
        if (error.status === 401) {
          // Verificar si es email no verificado
          if (errorMessage.includes('verificado') || errorMessage.includes('verified') || errorMessage.includes('email')) {
            this.errorMessage = 'Por favor verificá tu email antes de iniciar sesión.';
          } else {
            this.errorMessage = 'Credenciales incorrectas. Por favor verificá tu email y contraseña.';
          }
        } else if (error.status === 403) {
          // Email no verificado - caso explícito
          this.errorMessage = 'Por favor verificá tu email antes de iniciar sesión.';
        } else if (error.status === 0 || error.status === -1) {
          // Error de red (status 0 o -1 indica error de conexión)
          this.errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
        } else {
          this.errorMessage = error.error?.message || 'Ocurrió un error. Inténtalo de nuevo.';
        }
      },
    });
  }

  protected async googleLogin(): Promise<void> {
    // Validar que acepten los términos y condiciones (solo para nuevos usuarios)
    const acceptTerms = !!this.form.get('acceptTerms')?.value;
    if (!acceptTerms) {
      this.errorMessage = 'Debes aceptar los términos y condiciones para registrarte con Google';
      return;
    }

    // Prevenir race condition - si ya hay un login en proceso, salir
    if (this.googleLoading || this.googleAuthInProgress) {
      return;
    }

    this.googleLoading = true;
    this.googleAuthInProgress = true;
    this.errorMessage = '';

    try {
      const observable = await this.authService.googleLogin(acceptTerms);
      observable.subscribe({
        next: response => {
          this.googleLoading = false;
          this.googleAuthInProgress = false;
          const returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || this.authService.getRouteByRole(response.user.role);
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: any) => {
          this.googleLoading = false;
          this.googleAuthInProgress = false;
          
          // Analizar el tipo de error
          const errorMsg = error?.message?.toLowerCase() || '';
          
          // Si el usuario canceló, no mostrar error
          if (errorMsg.includes('cancelado') || errorMsg.includes('cancelled') || errorMsg.includes('cancel')) {
            return;
          }
          
          // Error de red - conexión fallida
          if (errorMsg.includes('conexión') || errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
            this.errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
            return;
          }
          
          // Error genérico de Google Auth
          if (!error.message?.includes('cancelado')) {
            this.errorMessage = error.message || 'Error al iniciar sesión con Google';
          }
        },
      });
    } catch (error: any) {
      this.googleLoading = false;
      this.googleAuthInProgress = false;
      
      const errorMsg = error?.message?.toLowerCase() || '';
      
      // Si el usuario canceló, no mostrar error
      if (errorMsg.includes('cancelado') || errorMsg.includes('cancelled') || errorMsg.includes('cancel')) {
        return;
      }
      
      // Error de red
      if (errorMsg.includes('conexión') || errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
        this.errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
        return;
      }
      
      if (!error.message?.includes('cancelado')) {
        this.errorMessage = error.message || 'Error al iniciar sesión con Google';
      }
    }
  }

  /**
   * Muestra un toast con el mensaje especificado
   */
  protected async showToast(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      position: 'bottom',
      color: 'medium',
      cssClass: 'custom-toast',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Handle para el link "¿Olvidaste tu contraseña?" - Placeholder
   */
  protected onForgotPassword(): void {
    this.showToast('Funcionalidad en desarrollo. Próximamente disponible.', 3000);
  }

  /**
   * Handle para el link "Términos y Condiciones"
   */
  protected onTermsAndConditions(): void {
    this.router.navigate(['/terms']);
  }
}
