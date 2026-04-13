import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, documentTextOutline, shieldCheckmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonButtons],
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
})
export class TermsPage {
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      arrowBackOutline,
      documentTextOutline,
      shieldCheckmarkOutline,
    });
  }

  protected goBack(): void {
    this.router.navigate(['/home']);
  }
}
