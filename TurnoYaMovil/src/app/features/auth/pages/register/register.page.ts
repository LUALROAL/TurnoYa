import { CommonModule } from "@angular/common";
import { Component, inject, ChangeDetectorRef, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { IonicModule, ToastController } from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  sparklesOutline,
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  warningOutline,
  syncOutline,
  personAddOutline,
  logoGoogle,
  informationCircleOutline
} from "ionicons/icons";

import { AuthService } from "../../services/auth.service";
import { ProfessionalService, AcceptInvitationResponse } from "../../../professional/services/professional.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./register.page.html",
  styleUrls: ["./register.page.scss"],
})
export class RegisterPage implements OnInit {
  constructor(private toastController: ToastController) {
    addIcons({
      sparklesOutline,
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircleOutline,
      checkmarkOutline,
      warningOutline,
      syncOutline,
      personAddOutline,
      logoGoogle,
      informationCircleOutline
    });
  }

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly professionalService = inject(ProfessionalService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly form = this.formBuilder.group({
    fullName: ["", [Validators.required, Validators.minLength(3)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  protected loading = false;
  protected showPassword = false;
  protected errorMessage = '';
  protected invitedMessage = '';
  protected pendingInvitationToken: string | null = null;

  async ngOnInit(): Promise<void> {
    // Verificar si hay un token de invitación pendiente
    this.pendingInvitationToken = sessionStorage.getItem('pendingInvitationToken');
    
    // Verificar query params para mensaje de invitación
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['invited'] === 'true' && queryParams['message']) {
      this.invitedMessage = queryParams['message'];
    }
    
    // Limpiar el token de sesión después de leerlo
    if (this.pendingInvitationToken) {
      sessionStorage.removeItem('pendingInvitationToken');
    }
  }

  // Bandera para prevenir race condition en Google Auth
  private googleAuthInProgress = false;

  // Métodos auxiliares para la fortaleza de contraseña
  protected get passwordLength(): number {
    return this.form.get('password')?.value?.length || 0;
  }

  protected get passwordStrengthClass(): string {
    const length = this.passwordLength;
    if (length < 4) return 'bg-red-500';
    if (length >= 4 && length < 6) return 'bg-yellow-500';
    if (length >= 6) return 'bg-neon-secondary';
    return 'bg-bg-tertiary';
  }

  protected get isWeakPassword(): boolean {
    return this.passwordLength < 4;
  }

  protected get isMediumPassword(): boolean {
    return this.passwordLength >= 4 && this.passwordLength < 6;
  }

  protected get isStrongPassword(): boolean {
    return this.passwordLength >= 6;
  }

  protected get isVeryStrongPassword(): boolean {
    return this.passwordLength >= 8;
  }

  protected   togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Login/Registro con Google
   */
  protected async googleLogin(): Promise<void> {
    // Validar que acepten los términos y condiciones
    const acceptTerms = !!this.form.get('acceptTerms')?.value;
    if (!acceptTerms) {
      this.errorMessage = 'Debes aceptar los términos y condiciones para continuar';
      this.cdr.detectChanges();
      return;
    }

    // Prevenir race condition
    if (this.loading || this.googleAuthInProgress) return;

    this.loading = true;
    this.googleAuthInProgress = true;
    this.errorMessage = '';

    try {
      const observable = await this.authService.googleLogin(acceptTerms);
      observable.subscribe({
        next: (response) => {
          this.loading = false;
          this.googleAuthInProgress = false;
          // Redirigir al home correcto según el rol
          const route = this.authService.getRouteByRole(response.user.role);
          void this.router.navigateByUrl(route);
        },
        error: (error: any) => {
          this.loading = false;
          this.googleAuthInProgress = false;
          console.error("Google login error:", error);
          
          // Analizar el tipo de error
          const errorMsg = (error.message || '').toLowerCase();
          
          // Si el usuario canceló, no mostrar error
          if (errorMsg.includes('cancelado') || errorMsg.includes('cancelled') || errorMsg.includes('cancel')) {
            return;
          }
          
          // Error de red - conexión fallida
          if (errorMsg.includes('conexión') || errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
            this.errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
            this.cdr.detectChanges();
            return;
          }
          
          // Si el error menciona "origin" o "403", es problema de configuración
          if (errorMsg.includes('origin') || errorMsg.includes('403')) {
            this.errorMessage = 'Error de configuración de Google. Contacta al administrador.';
          } else {
            this.errorMessage = error.message || 'Error al iniciar sesión con Google';
          }
          
          this.cdr.detectChanges();
        },
      });
    } catch (error: any) {
      this.loading = false;
      this.googleAuthInProgress = false;
      console.error("Google login exception:", error);
      
      const errorMsg = (error.message || '').toLowerCase();
      
      // Si el usuario canceló, no mostrar error
      if (errorMsg.includes('cancelado') || errorMsg.includes('cancelled') || errorMsg.includes('cancel')) {
        return;
      }
      
      // Error de red
      if (errorMsg.includes('conexión') || errorMsg.includes('connection') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
        this.errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
        this.cdr.detectChanges();
        return;
      }
      
      if (errorMsg.includes('origin') || errorMsg.includes('403')) {
        this.errorMessage = 'Error de configuración de Google. Contacta al administrador.';
      } else {
        this.errorMessage = error.message || 'Error al iniciar sesión con Google';
      }
      
      this.cdr.detectChanges();
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
   * Handle para el link "Términos y Condiciones"
   */
  protected onTermsAndConditions(): void {
    this.router.navigate(['/terms']);
  }

  /**
   * Handle para el link "Política de Privacidad" - Placeholder
   */
  protected onPrivacyPolicy(): void {
    this.router.navigate(['/terms']);
  }

  protected submit() {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, password } = this.form.getRawValue();
    if (!fullName || !email || !password) {
      return;
    }

    const normalizedFullName = fullName.trim().toUpperCase();
    const acceptTerms = !!this.form.get('acceptTerms')?.value;

    this.loading = true;
    this.errorMessage = '';
    this.authService.register(normalizedFullName, email, password, acceptTerms).subscribe({
      next: () => {
        this.loading = false;
        
        // Si hay un token de invitación pendiente, intentar vincular al empleado
        if (this.pendingInvitationToken) {
          this.acceptInvitationAfterRegister();
        } else {
          void this.router.navigateByUrl("/auth/login");
        }
      },
      error: (error) => {
        this.loading = false;
        console.log("Register error:", error);
        
        // El error puede tener diferentes estructuras
        let errorMessage = '';
        let status = error.status;
        
        // Extraer el mensaje del error
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.log("Status:", status, "Message:", errorMessage);
        
        // Verificar si es error de email duplicado (cualquiera sea el status)
        const lowerMessage = errorMessage.toLowerCase();
        if (lowerMessage.includes('email') || 
            lowerMessage.includes('correo') || 
            lowerMessage.includes('registrado') ||
            lowerMessage.includes('ya está') ||
            lowerMessage.includes('ya está registrado')) {
          this.errorMessage = 'El correo electrónico ya está registrado. Intenta iniciar sesión.';
        } else if (status === 0 || status === null || status === undefined) {
          this.errorMessage = 'No se pudo conectar con el servidor.';
        } else {
          this.errorMessage = errorMessage || 'Ocurrió un error. Inténtalo de nuevo.';
        }
        
            this.cdr.detectChanges();
      },
    });
  }

  /**
   * Acepta la invitación después de un registro exitoso
   */
  private acceptInvitationAfterRegister(): void {
    if (!this.pendingInvitationToken) return;

    this.professionalService.acceptInvitation(this.pendingInvitationToken).subscribe({
      next: (response: AcceptInvitationResponse) => {
        this.loading = false;
        
        if (response.success) {
          // Redirigir al panel de profesional
          void this.router.navigate(['/professional/home']);
        } else {
          // La invitación falló pero el usuario ya está registrado
          this.errorMessage = response.message || 'La invitación no pudo ser procesada. Podrás acceder desde tu panel.';
          //仍然导航到登录页面
          void this.router.navigateByUrl("/auth/login");
        }
      },
      error: (error) => {
        this.loading = false;
        // 即使邀请失败，用户也已注册
        console.error('Accept invitation error:', error);
        void this.router.navigateByUrl("/auth/login");
      },
    });
  }
}
