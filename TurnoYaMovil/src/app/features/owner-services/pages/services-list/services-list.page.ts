import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  timeOutline,
  trashOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { OwnerService } from '../../models';
import { OwnerServicesService } from '../../services/owner-services.service';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  templateUrl: './services-list.page.html',
  styleUrl: './services-list.page.scss',
})
export class ServicesListPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly ownerServicesService = inject(OwnerServicesService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected isEmpty = false;
  protected services: OwnerService[] = [];

  constructor() {
    addIcons({
      arrowBackOutline,
      addOutline,
      createOutline,
      trashOutline,
      cashOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';

    if (!this.businessId) {
      this.notify.showError('No se encontró el negocio');
      this.loading = false;
      this.isEmpty = true;
      return;
    }

    this.loadServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    if (this.businessId) {
      this.loadServices();
    }
  }

  protected trackByServiceId(_: number, service: OwnerService): string {
    return service.id;
  }

  protected toggleServiceStatus(service: OwnerService): void {
    const newStatus = !service.isActive;

    this.ownerServicesService
      .update(service.id, { isActive: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          service.isActive = newStatus;
          this.notify.showSuccess(
            `Servicio ${newStatus ? 'activado' : 'desactivado'} correctamente`
          );
        },
        error: (error: unknown) => {
          console.error('Error al cambiar estado del servicio:', error);
          this.notify.showError('No se pudo cambiar el estado del servicio');
        },
      });
  }

  protected deleteService(service: OwnerService): void {
    const confirmed = confirm(`¿Estás seguro de eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    this.ownerServicesService
      .delete(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.services = this.services.filter(item => item.id !== service.id);
          this.isEmpty = this.services.length === 0;
          this.notify.showSuccess('Servicio eliminado correctamente');
        },
        error: (error: unknown) => {
          console.error('Error al eliminar servicio:', error);
          this.notify.showError('No se pudo eliminar el servicio');
        },
      });
  }

  private loadServices(): void {
    this.loading = true;

    this.ownerServicesService
      .getByBusinessId(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (services: OwnerService[]) => {
          this.services = services;
          this.isEmpty = services.length === 0;
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar servicios:', error);
          this.notify.showError('No se pudieron cargar los servicios del negocio');
          this.services = [];
          this.isEmpty = true;
          this.loading = false;
        },
      });
  }
}
