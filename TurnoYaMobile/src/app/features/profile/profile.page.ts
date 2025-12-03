import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption
  ]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  selectedRole: UserRole | null = null;

  roleOptions = [
    { value: UserRole.Customer, label: 'Cliente - Busco servicios' },
    { value: UserRole.BusinessOwner, label: 'Dueño de Negocio - Ofrezco servicios' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
      this.selectedRole = user?.role || null;
    });
  }

  async onRoleChange() {
    if (!this.selectedRole || this.selectedRole === this.user?.role) return;

    const alert = await this.alertController.create({
      header: 'Cambiar Rol',
      message: `¿Deseas cambiar tu rol a ${this.selectedRole === UserRole.Customer ? 'Cliente' : 'Dueño de Negocio'}? Esto actualizará los módulos disponibles.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', handler: () => {
          this.selectedRole = this.user?.role || null;
        }},
        { text: 'Confirmar', handler: async () => {
          try {
            await this.authService.switchRole(this.selectedRole!);
            await this.showToast('Rol actualizado correctamente', 'success');
            this.router.navigate(['/home']);
          } catch (error: any) {
            await this.showToast(error.message || 'Error al cambiar el rol', 'danger');
            this.selectedRole = this.user?.role || null;
          }
        }}
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
