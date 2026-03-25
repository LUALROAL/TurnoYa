import { CommonModule } from "@angular/common";
import { Component, inject, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";
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
  logoGoogle
} from "ionicons/icons";

import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./register.page.html",
  styleUrls: ["./register.page.scss"],
})
export class RegisterPage {
  constructor() {
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
      logoGoogle
    });
  }
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
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

    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      const observable = await this.authService.googleLogin(acceptTerms);
      observable.subscribe({
        next: () => {
          this.loading = false;
          // Redirigir al home correcto según el rol
          void this.router.navigateByUrl("/auth/login");
        },
        error: (error: any) => {
          this.loading = false;
          console.error("Google login error:", error);
          
          // Analizar el error para dar un mensaje más específico
          let errorMsg = error.message || 'Error al iniciar sesión con Google';
          
          // Si el error menciona "origin" o "403", es problema de configuración
          if (errorMsg.toLowerCase().includes('origin') || errorMsg.toLowerCase().includes('403')) {
            errorMsg = 'Error de configuración de Google. Contacta al administrador.';
          }
          
          this.errorMessage = errorMsg;
          this.cdr.detectChanges();
        },
      });
    } catch (error: any) {
      this.loading = false;
      console.error("Google login exception:", error);
      
      let errorMsg = error.message || 'Error al iniciar sesión con Google';
      
      if (errorMsg.toLowerCase().includes('origin') || errorMsg.toLowerCase().includes('403')) {
        errorMsg = 'Error de configuración de Google. Contacta al administrador.';
      }
      
      this.errorMessage = errorMsg;
      this.cdr.detectChanges();
    }
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
        void this.router.navigateByUrl("/auth/login");
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
}
