import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";

import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./register.page.html",
  styleUrls: ["./register.page.scss"],
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.group({
    fullName: ["", [Validators.required, Validators.minLength(3)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  protected loading = false;
  protected showPassword = false;
  protected errorMessage = '';

  protected togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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

    this.loading = true;
    this.errorMessage = '';
    this.authService.register(fullName, email, password).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl("/auth/login");
      },
      error: (error) => {
        this.loading = false;
        // Mostrar mensaje de error específico
        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'El correo ya está registrado o los datos son inválidos.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor.';
        } else {
          this.errorMessage = error.error?.message || 'Ocurrió un error. Inténtalo de nuevo.';
        }
      },
    });
  }
}
