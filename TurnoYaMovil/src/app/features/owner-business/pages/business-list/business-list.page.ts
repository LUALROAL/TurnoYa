import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  businessOutline,
  constructOutline,
  peopleOutline,
  calendarOutline,
  locationOutline,
  callOutline,
  mailOutline,
  star,
  toggleOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
  settingsOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { OwnerBusiness } from '../../models';
import { NotifyService } from '../../../../core/services/notify.service';

@Component({
  selector: 'app-business-list',
  templateUrl: './business-list.page.html',
  styleUrls: ['./business-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
  ],
})
export class BusinessListPage implements OnInit, OnDestroy {
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  protected businesses: OwnerBusiness[] = [];
  protected loading = true;
  protected isEmpty = false;

  constructor() {
    addIcons({
      addOutline,
      businessOutline,
      constructOutline,
      peopleOutline,
      calendarOutline,
      locationOutline,
      callOutline,
      mailOutline,
      star,
      toggleOutline,
      createOutline,
      trashOutline,
      eyeOutline,
      checkmarkCircleOutline,
      arrowBackOutline,
      settingsOutline,
    });
  }

  ngOnInit() {
    this.loadMyBusinesses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.loadMyBusinesses();
  }

  private loadMyBusinesses(): void {
    this.loading = true;
    this.ownerBusinessService
      .getMyBusinesses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (businesses: OwnerBusiness[]) => {
          this.businesses = businesses;
          this.isEmpty = businesses.length === 0;
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error loading businesses:', error);
          this.notify.showError('No se pudieron cargar tus negocios');
          this.loading = false;
          this.isEmpty = true;
        },
      });
  }

  protected toggleBusinessStatus(business: OwnerBusiness, event: Event): void {
    event.stopPropagation();
    const newStatus = !business.isActive;

    this.ownerBusinessService
      .toggleActive(business.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          business.isActive = newStatus;
          this.notify.showSuccess(
            `Negocio ${newStatus ? 'activado' : 'desactivado'} correctamente`
          );
        },
        error: (error: unknown) => {
          console.error('Error toggling business status:', error);
          this.notify.showError('No se pudo cambiar el estado del negocio');
        },
      });
  }

  protected trackByBusinessId(_: number, business: OwnerBusiness): string {
    return business.id;
  }
}
