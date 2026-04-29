import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { starOutline, star, checkmarkOutline, closeOutline } from 'ionicons/icons';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';

export interface BusinessValidationResult {
  knowsBusiness: boolean;
  rating?: number;
  appointmentId: string;
  businessId: string;
}

/** Props que acepta el modal desde el componente padre */
export interface BusinessValidationModalProps {
  appointmentId: string;
  businessId: string;
  businessName: string;
}

@Component({
  selector: 'app-business-validation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon, IonText],
  templateUrl: './business-validation-modal.component.html',
  styleUrls: ['./business-validation-modal.component.scss'],
})
export class BusinessValidationModalComponent {
  private readonly modalController = inject(ModalController);

  @Input() businessName = '';
  @Input() appointmentId = '';
  @Input() businessId = '';
  selectedRating = 0;
  showRating = false;

  constructor() {
    addIcons({ starOutline, star, checkmarkOutline, closeOutline });
  }

  onKnowsBusiness(knows: boolean): void {
    if (knows) {
      this.showRating = true;
    } else {
      this.submitValidation({ knowsBusiness: false, appointmentId: this.appointmentId, businessId: this.businessId });
    }
  }

  onRatingSelect(rating: number): void {
    this.selectedRating = rating;
  }

  submitWithRating(): void {
    if (this.selectedRating > 0) {
      this.submitValidation({
        knowsBusiness: true,
        rating: this.selectedRating,
        appointmentId: this.appointmentId,
        businessId: this.businessId,
      });
    }
  }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente',
    };
    return labels[rating] || '';
  }

  dismiss(): void {
    this.modalController.dismiss(null, 'dismiss');
  }

  private submitValidation(result: BusinessValidationResult): void {
    this.modalController.dismiss(result, 'validate');
  }
}