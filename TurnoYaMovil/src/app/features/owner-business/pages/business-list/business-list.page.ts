import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonModal,
  IonButton,
  IonSpinner,
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
  arrowBack,
  linkOutline,
  closeOutline,
  personOutline,
  briefcaseOutline,
} from 'ionicons/icons';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { OwnerBusinessService } from '../../services/owner-business.service';
import { OwnerBusiness } from '../../models';
import { NotifyService } from '../../../../core/services/notify.service';
import { SignalRService } from '../../../../core/services/signalr.service';
import { UserService } from 'src/app/features/account/services/user.service';
import { ProfessionalService, AcceptInvitationResponse } from '../../../professional/services/professional.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-business-list',
  templateUrl: './business-list.page.html',
  styleUrls: ['./business-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonModal,
    IonSpinner,
    HasPermissionDirective,
  ],
})
export class BusinessListPage implements OnInit, OnDestroy {
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly notify = inject(NotifyService);
  private readonly signalRService = inject(SignalRService);
  private readonly destroy$ = new Subject<void>();
  private readonly professionalService = inject(ProfessionalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  // Modal state for joining business
  protected showJoinModal = false;
  protected joinCode = '';
  protected joinLoading = false;
  protected isJoinMode = false;

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
      arrowBack,
      linkOutline,
      closeOutline,
      personOutline,
      briefcaseOutline,
    });
  }

  ngOnInit() {
    // Verificar si hay query params para abrir modal de join
    const action = this.route.snapshot.queryParams['action'];
    this.isJoinMode = action === 'join';

    if (this.isJoinMode) {
      // Abrir modal después de un pequeño delay para que cargue la vista
      setTimeout(() => {
        this.openJoinModal();
      }, 500);
    }

    // Subscribe to employee unlink events to refresh the business list
    this.signalRService.employeeUnlinked$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        console.log('[BusinessList] Employee unlinked event received, refreshing list...');
        this.loadMyBusinesses();
      });

    // Also subscribe to employee linked events (in case employee joins via invitation)
    this.signalRService.employeeLinked$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        console.log('[BusinessList] Employee linked event received, refreshing list...');
        this.loadMyBusinesses();
      });

    this.loadMyBusinesses();
  }

  protected handleBack(): void {
    if (this.showJoinModal) {
      this.closeJoinModal();
    } else {
      this.router.navigate(['/home']);
    }
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
          const backendMessage = this.getBackendMessage(error);
          if (!backendMessage) {
            this.notify.showError('No se pudo cambiar el estado del negocio');
          }
        },
      });
  }

  protected trackByBusinessId(_: number, business: OwnerBusiness): string {
    return business.id;
  }

  protected deleteBusiness(businessId: string): void {
    this.ownerBusinessService.delete(businessId)
      .pipe(
        takeUntil(this.destroy$),
        // Después de eliminar, actualiza la sesión (el rol podría cambiar a Customer)
        switchMap(() => this.userService.refreshUserProfile())
      )
      .subscribe({
        next: () => {
          this.notify.showSuccess('Negocio eliminado correctamente');
          this.loadMyBusinesses(); // recarga la lista
        },
        error: (error) => {
          console.error('Error al eliminar negocio:', error);
          const backendMessage = this.getBackendMessage(error);
          if (!backendMessage) {
            this.notify.showError('No se pudo eliminar el negocio');
          }
        }
      });
  }

  private getBackendMessage(error: unknown): string | null {
    const maybeError = error as { error?: { message?: string } };
    return maybeError?.error?.message ?? null;
  }
  getImageSrc(base64: string | undefined): string {
    if (!base64) return '';
    return base64.startsWith('data:image') ? base64 : 'data:image/jpeg;base64,' + base64;
  }

  // ===== MÉTODO PARA VERIFICAR SI ES OWNER =====
  protected isOwner(business: OwnerBusiness): boolean {
    return business.relationshipType === 'owner';
  }

  // ===== MÉTODO PARA VERIFICAR SI TIENE ALGÚN NEGOCIO COMO OWNER =====
  protected get hasAnyOwnerBusiness(): boolean {
    return this.businesses.some(b => b.relationshipType === 'owner');
  }

  // ===== MÉTODO PARA EL BOTÓN DE EMPLEADOS =====
  protected canViewEmployees(business: OwnerBusiness): boolean {
    // Ahora todos pueden ver el botón (el owner ve la lista, el empleado ver su propio perfil)
    return true;
  }

  protected getEmployeeButtonText(business: OwnerBusiness): string {
    return business.relationshipType === 'owner' || this.hasPermission('canViewEmployees') ? 'Empleados' : 'Empleado';
  }

  protected getEmployeeButtonIcon(business: OwnerBusiness): string {
    return business.relationshipType === 'owner' || this.hasPermission('canViewEmployees') ? 'people-outline' : 'person-outline';
  }

  private hasPermission(permission: string): boolean {
    // Usa AuthService para verificar permisos del empleado
    return this.authService.hasPermission(permission);
  }

  // ===== MÉTODOS PARA ASOCIARSE A UN NEGOCIO =====

  protected openJoinModal(): void {
    console.log('Opening join modal...');
    this.showJoinModal = true;
    this.joinCode = '';
  }

  protected closeJoinModal(): void {
    this.showJoinModal = false;
    this.joinCode = '';
  }

  protected joinBusiness(): void {
    console.log('Joining business with code:', this.joinCode);
    if (!this.joinCode.trim()) {
      this.notify.showError('Ingresa el código de asociación');
      return;
    }

    const code = this.joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      this.notify.showError('El código debe tener 6 caracteres');
      return;
    }

    this.joinLoading = true;
    this.professionalService.acceptInvitationByCode(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AcceptInvitationResponse) => {
          this.joinLoading = false;
          if (response.success) {
            this.notify.showSuccess('Te has asociado al negocio correctamente');
            this.closeJoinModal();

            // Refresh user profile to get updated role
            this.userService.refreshUserProfile().subscribe({
              next: () => {
                // Recargar la lista de negocios
                this.loadMyBusinesses();
              },
              error: (err) => {
                console.error('Error refreshing profile:', err);
                this.loadMyBusinesses();
              }
            });
          } else {
            this.notify.showError(response.message);
          }
        },
        error: (error) => {
          this.joinLoading = false;
          console.error('Error joining business:', error);
          this.notify.showError('No se pudo completar la asociación. Verifica el código.');
        },
      });
  }
}
