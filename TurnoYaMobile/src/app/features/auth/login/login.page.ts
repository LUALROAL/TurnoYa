import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';

// Icons are globally registered in main.ts, so we don't need addIcons here
// We just import IonIcon to use the component.

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const loginData: LoginRequest = this.loginForm.value;

    this.authService.login(loginData).subscribe({
      next: async () => {
        // Success: Redirect to business list
        await this.showToast('¡Bienvenido!', 'success');
        this.router.navigate(['/business/list']);
        this.isLoading = false;
      },
      error: async (error) => {
        // Error: Show feedback
        console.error('Login error:', error);
        await this.showToast(error.message || 'Credenciales incorrectas', 'danger');
        this.isLoading = false;
      }
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: 't-toast' // We can style this globally later
    });
    await toast.present();
  }

  // Helper getters for template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
