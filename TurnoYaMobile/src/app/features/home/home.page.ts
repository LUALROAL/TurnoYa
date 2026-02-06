import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  calendarOutline,
  personOutline,
  cardOutline,
  logOutOutline,
  albumsOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    RouterLink
  ]
})
export class HomePage implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private navController: NavController
  ) {
    addIcons({
      businessOutline,
      calendarOutline,
      personOutline,
      cardOutline,
      logOutOutline,
      albumsOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'Invitado';
    const first = this.currentUser.firstName?.trim();
    const last = this.currentUser.lastName?.trim();
    return [first, last].filter(Boolean).join(' ') || this.currentUser.email;
  }

  getInitials(): string {
    if (!this.currentUser) return 'TY';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'TY';
  }

  getRoleLabel(): string {
    switch (this.currentUser?.role) {
      case UserRole.BusinessOwner:
        return 'Propietario';
      case UserRole.Employee:
        return 'Empleado';
      case UserRole.Admin:
        return 'Administrador';
      default:
        return 'Cliente';
    }
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  get isBusinessOwner(): boolean {
    return this.authService.isBusinessOwner();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  async logout() {
    await this.authService.logout();
    this.navController.navigateRoot('/login');
  }
}
