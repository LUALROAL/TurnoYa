import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  calendarOutline,
  personOutline,
  cardOutline,
  logOutOutline
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
    IonIcon
  ]
})
export class HomePage implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      businessOutline,
      calendarOutline,
      personOutline,
      cardOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
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
    this.router.navigate(['/login']);
  }
}
