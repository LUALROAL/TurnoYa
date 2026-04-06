import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  personAddOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { ProfessionalService, AcceptInvitationResponse } from '../../../professional/services/professional.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './accept-invitation.page.html',
  styleUrls: ['./accept-invitation.page.scss'],
})
export class AcceptInvitationPage implements OnInit {
  constructor() {
    addIcons({
      mailOutline,
      personAddOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      arrowBackOutline,
    });
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  private readonly professionalService = inject(ProfessionalService);

  protected token: string | null = null;
  protected loading = true;
  protected error: string | null = null;
  protected success: boolean = false;
  protected employeeName: string = '';

  async ngOnInit(): Promise<void> {
    // Obtener el token de la URL
    this.token = this.route.snapshot.queryParams['token'];

    if (!this.token) {
      this.error = 'No se encontró el token de invitación';
      this.loading = false;
      return;
    }

    // Verificar si el usuario está logueado
    if (this.authSession.hasValidSession()) {
      // Usuario logueado - intentar aceptar invitación directamente
      await this.acceptInvitation();
    } else {
      // Usuario no logueado - guardar token y redirigir a registro
      this.saveTokenAndRedirect();
    }
  }

  private async acceptInvitation(): Promise<void> {
    this.loading = true;
    this.error = null;

    this.professionalService.acceptInvitation(this.token!).subscribe({
      next: (response: AcceptInvitationResponse) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          this.employeeName = response.employeeId || 'empleado';
          
          // Redirigir al panel de profesional después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/professional/home']);
          }, 2000);
        } else {
          this.error = response.message;
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = 'Error al procesar la invitación. Intenta más tarde.';
        console.error('Accept invitation error:', err);
      },
    });
  }

  private saveTokenAndRedirect(): void {
    // Guardar el token en sessionStorage para usarlo después del registro
    sessionStorage.setItem('pendingInvitationToken', this.token!);
    this.loading = false;
    
    // Redirigir a registro con mensaje
    this.router.navigate(['/auth/register'], {
      queryParams: { 
        invited: 'true',
        message: 'Necesitas crear una cuenta para aceptar la invitación'
      }
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { 
        token: this.token 
      }
    });
  }
}
