import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";

import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly form = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
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

    const { email, password } = this.form.getRawValue();
    if (!email || !password) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.authService.login(email, password).subscribe({
      next: response => {
        this.loading = false;
        // Obtener returnUrl del query param o usar ruta por defecto
        const returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || this.resolveRouteByRole(response.user.role);
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.loading = false;
        // Mostrar mensaje de error específico
        if (error.status === 401) {
          this.errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor.';
        } else {
          this.errorMessage = error.error?.message || 'Ocurrió un error. Inténtalo de nuevo.';
        }
      },
    });
  }

  private resolveRouteByRole(role: string) {
    if (role === "BusinessOwner") {
      return "/home";
    }

    if (role === "Admin") {
      return "/home";
    }

    return "/home";
  }
}
