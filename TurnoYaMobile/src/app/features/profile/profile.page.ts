import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonBackButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models';
// Icons handled globally via main.ts

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonBackButton
  ]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  selectedRole: UserRole | null = null;

  roleOptions = [
    { value: UserRole.Customer, label: 'Cliente', description: 'Busca negocios y agenda tus citas.' },
    { value: UserRole.BusinessOwner, label: 'Dueño de Negocio', description: 'Gestiona tu negocio y servicios.' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
      this.selectedRole = user?.role || null;
    });
  }

  getInitials(first?: string, last?: string): string {
    return ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase();
  }

  getRoleLabel(role?: UserRole): string {
    return role === UserRole.BusinessOwner ? 'Propietario' : 'Cliente';
  }

  async confirmRoleChange(role: UserRole) {
    if (role === this.user?.role) return;

    this.selectedRole = role; // Optimistic update UI selection

    const alert = await this.alertController.create({
      header: 'Cambiar Rol',
      message: `¿Cambiar a modo ${role === UserRole.Customer ? 'Cliente' : 'Negocio'}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.selectedRole = this.user?.role || null; // Revert
          }
        },
        {
          text: 'Confirmar',
          handler: async () => {
            await this.executeRoleChange(role);
          }
        }
      ],
      cssClass: 't-alert' // Custom class if we need overrides
    });

    await alert.present();
  }

  async executeRoleChange(role: UserRole) {
    try {
      await this.authService.switchRole(role);
      await this.showToast('Rol actualizado correctamente', 'success');
      this.router.navigate(['/home']);
    } catch (error: any) {
      await this.showToast(error.message || 'Error al cambiar el rol', 'danger');
      this.selectedRole = this.user?.role || null; // Revert
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      cssClass: 't-toast'
    });
    await toast.present();
  }
}
