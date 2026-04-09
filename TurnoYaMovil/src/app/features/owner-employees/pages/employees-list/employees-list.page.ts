import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonModal, IonSpinner, IonButton, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  callOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  copyOutline,
  createOutline,
  linkOutline,
  mailOutline,
  personOutline,
  peopleOutline,
  shareOutline,
  timeOutline,
  trashOutline,
  briefcaseOutline,
  shieldOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { OwnerEmployee } from '../../models';
import { OwnerService } from '../../../owner-services/models/owner-service.model';
import { OwnerEmployeesService } from '../../services/owner-employees.service';
import { OwnerServicesService } from '../../../owner-services/services/owner-services.service';
import { ProfessionalService, InvitationResponse } from '../../../professional/services/professional.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { OwnerBusinessService } from '../../../owner-business/services/owner-business.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [IonSpinner, CommonModule, RouterLink, IonContent, IonIcon, IonModal],
  templateUrl: './employees-list.page.html',
  styleUrls: ['./employees-list.page.scss'],
})
export class EmployeesListPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerEmployeesService = inject(OwnerEmployeesService);
  private readonly ownerServicesService = inject(OwnerServicesService);
  private readonly professionalService = inject(ProfessionalService);
  private readonly notify = inject(NotifyService);
  private readonly authSession = inject(AuthSessionService);
  private readonly authService = inject(AuthService);
  private readonly ownerBusinessService = inject(OwnerBusinessService);
  private readonly alertController = inject(AlertController);

  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected isEmpty = false;
  protected employees: OwnerEmployee[] = [];
  protected selectedEmployee: OwnerEmployee | null = null;
  protected showServicesModal = false;
  protected showAddServiceModal = false;
  protected serviceNameMap: Map<string, string> = new Map();
  protected availableServices: OwnerService[] = [];
  protected assigningService = false;
  protected isOwnProfile = false;

  // Invitation modal state
  protected showInvitationModal = false;
  protected currentInvitation: InvitationResponse | null = null;
  protected invitationLoading = false;

  constructor() {
    addIcons({
      addOutline,
      arrowBackOutline,
      createOutline,
      trashOutline,
      peopleOutline,
      personOutline,
      callOutline,
      mailOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      shareOutline,
      copyOutline,
      briefcaseOutline,
      shieldOutline,
      linkOutline
    });
  }

  protected generateInvitation(employee: OwnerEmployee): void {
    this.selectedEmployee = employee;
    this.invitationLoading = true;
    this.showInvitationModal = true;
    this.currentInvitation = null;

    this.professionalService
      .generateInvitation(employee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.invitationLoading = false;
          this.currentInvitation = response;
        },
        error: (error: unknown) => {
          this.invitationLoading = false;
          console.error('Error al generar invitación:', error);
          const backendMessage = this.getBackendMessage(error);
          this.notify.showError(backendMessage || 'No se pudo generar el enlace de invitación');
          this.closeInvitationModal();
        },
      });
  }

  protected closeInvitationModal(): void {
    this.showInvitationModal = false;
    this.currentInvitation = null;
    this.selectedEmployee = null;
  }

  protected copyInvitationLink(): void {
    if (this.currentInvitation?.invitationLink) {
      navigator.clipboard.writeText(this.currentInvitation.invitationLink).then(() => {
        this.notify.showSuccess('Enlace copiado al portapapeles');
      }).catch(() => {
        this.notify.showError('No se pudo copiar el enlace');
      });
    }
  }

  protected copyInvitationCode(): void {
    if (this.currentInvitation?.shortCode) {
      navigator.clipboard.writeText(this.currentInvitation.shortCode).then(() => {
        this.notify.showSuccess('Código copiado al portapapeles');
      }).catch(() => {
        this.notify.showError('No se pudo copiar el código');
      });
    }
  }

  protected unlinkEmployee(employee: OwnerEmployee): void {
    this.alertController.create({
      header: 'Desvincular Empleado',
      message: `¿Está seguro que desea desvincular a ${employee.firstName} ${employee.lastName}? El empleado perderá acceso al negocio.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.executeUnlink(employee);
          },
        },
      ],
    }).then(alert => alert.present());
  }

  private executeUnlink(employee: OwnerEmployee): void {
    this.ownerEmployeesService
      .unlink(employee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unlinkedEmployee) => {
          // Actualizar el empleado en la lista local
          const idx = this.employees.findIndex(e => e.id === employee.id);
          if (idx !== -1) {
            this.employees[idx] = unlinkedEmployee;
          }
          this.notify.showSuccess(`${employee.firstName} ha sido desvinculado del negocio`);
        },
        error: (error: unknown) => {
          console.error('Error al desvincular empleado:', error);
          const backendMessage = this.getBackendMessage(error);
          this.notify.showError(backendMessage || 'No se pudo desvincular el empleado');
        },
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

    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    if (this.businessId) {
      this.loadEmployees();
    }
  }

  protected trackByEmployeeId(_: number, employee: OwnerEmployee): string {
    return employee.id;
  }

  protected openServicesModal(employee: OwnerEmployee): void {
    this.selectedEmployee = employee;
    this.showServicesModal = true;
  }

  protected closeServicesModal(): void {
    this.showServicesModal = false;
    this.selectedEmployee = null;
  }

  protected navigating = false;

  protected navigateToEdit(serviceId: string): void {
    // show some feedback and wait for modal to close animation
    this.navigating = true;
    this.closeServicesModal();
    // small delay to ensure modal is dismissed before routing
    setTimeout(() => {
      this.router
        .navigate([
          '/owner/businesses',
          this.businessId,
          'services',
          serviceId,
          'edit',
        ])
        .finally(() => {
          this.navigating = false;
        });
    }, 250);
  }

  protected confirmUnassign(serviceId: string): void {
    if (!this.selectedEmployee) {
      return;
    }
    const serviceName = this.getServiceName(serviceId);
    this.alertController.create({
      header: 'Quitar Servicio',
      message: `¿Deseas quitar el servicio "${serviceName}" de este empleado?`,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.unassignService(serviceId);
          },
        },
      ],
    }).then(alert => alert.present());
  }

  private unassignService(serviceId: string): void {
    if (!this.selectedEmployee) {
      return;
    }
    const employee = this.selectedEmployee;
    const currentIds = employee.serviceIds || [];
    const nextIds = currentIds.filter(id => id !== serviceId);

    this.ownerEmployeesService
      .update(employee.id, { serviceIds: nextIds })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // update local state
          employee.serviceIds = nextIds;
          // also update main list copy
          const idx = this.employees.findIndex(e => e.id === employee.id);
          if (idx !== -1) {
            this.employees[idx].serviceIds = nextIds;
          }
          this.notify.showSuccess('Servicio desasignado correctamente');
        },
        error: (error: unknown) => {
          console.error('Error al desasignar servicio:', error);
          const backendMessage = this.getBackendMessage(error);
          if (!backendMessage) {
            this.notify.showError('No se pudo quitar el servicio');
          }
        },
      });
  }

  protected getAvailableServicesForEmployee(): OwnerService[] {
    if (!this.selectedEmployee) {
      return [];
    }
    const assignedIds = new Set(this.selectedEmployee.serviceIds || []);
    return this.availableServices.filter(s => !assignedIds.has(s.id) && s.isActive);
  }

  protected openAddServiceModal(): void {
    this.showAddServiceModal = true;
  }

  protected closeAddServiceModal(): void {
    this.showAddServiceModal = false;
  }

  protected assignService(serviceId: string): void {
    if (!this.selectedEmployee) {
      return;
    }
    const employee = this.selectedEmployee;
    const currentIds = employee.serviceIds || [];

    if (currentIds.includes(serviceId)) {
      this.notify.showError('Este servicio ya está asignado al empleado');
      return;
    }

    const nextIds = Array.from(new Set([...currentIds, serviceId]));
    this.assigningService = true;

    this.ownerEmployeesService
      .update(employee.id, { serviceIds: nextIds })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.assigningService = false;
          // update local state
          employee.serviceIds = nextIds;
          // also update main list copy
          const idx = this.employees.findIndex(e => e.id === employee.id);
          if (idx !== -1) {
            this.employees[idx].serviceIds = nextIds;
          }
          this.notify.showSuccess('Servicio asignado correctamente');
        },
        error: (error: unknown) => {
          this.assigningService = false;
          console.error('Error al asignar servicio:', error);
          const backendMessage = this.getBackendMessage(error);
          if (!backendMessage) {
            this.notify.showError('No se pudo asignar el servicio');
          }
        },
      });
  }

  protected getEmployeeServicesCount(employee: OwnerEmployee): number {
    return employee.serviceIds?.length || 0;
  }

  protected getServiceName(serviceId: string): string {
    // Busca en el mapa de cache, si no está, usa el ID como fallback
    return this.serviceNameMap.get(serviceId) || serviceId;
  }

  private buildServiceNameMap(): void {
    this.serviceNameMap.clear();
    this.availableServices.forEach(service => {
      this.serviceNameMap.set(service.id, service.name);
    });
  }

  protected toggleEmployeeStatus(employee: OwnerEmployee): void {
    const newStatus = !employee.isActive;

    this.ownerEmployeesService
      .update(employee.id, { isActive: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          employee.isActive = newStatus;
          this.notify.showSuccess(
            `Empleado ${newStatus ? 'activado' : 'desactivado'} correctamente`
          );
        },
        error: (error: unknown) => {
          console.error('Error al cambiar estado del empleado:', error);
          const backendMessage = this.getBackendMessage(error);
          if (!backendMessage) {
            this.notify.showError('No se pudo cambiar el estado del empleado');
          }
        },
      });
  }

  protected deleteEmployee(employee: OwnerEmployee): void {
    this.alertController.create({
      header: 'Eliminar Empleado',
      message: `¿Estás seguro de eliminar a "${employee.firstName} ${employee.lastName}"? Esta acción no se puede deshacer.`,
      cssClass: 'custom-alert danger-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          cssClass: 'alert-button-danger',
          handler: () => {
            this.executeDelete(employee);
          },
        },
      ],
    }).then(alert => alert.present());
  }

  private executeDelete(employee: OwnerEmployee): void {
    this.ownerEmployeesService
      .delete(employee.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.employees = this.employees.filter(item => item.id !== employee.id);
          this.isEmpty = this.employees.length === 0;
          this.notify.showSuccess('Empleado eliminado correctamente');
        },
        error: (error: unknown) => {
          console.error('Error al eliminar empleado:', error);
          const backendMessage = this.getBackendMessage(error);
          if (!backendMessage) {
            this.notify.showError('No se pudo eliminar el empleado');
          }
        },
      });
  }

  private getBackendMessage(error: unknown): string | null {
    const maybeError = error as { error?: { message?: string } };
    return maybeError?.error?.message ?? null;
  }

  private loadEmployees(): void {
    this.loading = true; // Iniciamos el loading state
    const session = this.authSession.getSession();

    // Verify ownership directly from business entity to bypass stale JWT roles
    this.ownerBusinessService.getById(this.businessId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (business) => {
        const sessionUserId = session?.user?.id?.toLowerCase() || '';
        const businessOwnerId = business.ownerId?.toLowerCase() || '';
        const isOwner = (businessOwnerId && businessOwnerId === sessionUserId) || 
                        session?.user?.role === 'BusinessOwner' || 
                        session?.user?.role === 'Admin';
        const canViewAll = isOwner || this.authService.hasPermission('canViewEmployees');
        
        console.log('[DEBUG] Session ID:', sessionUserId);
        console.log('[DEBUG] Business Owner ID:', businessOwnerId);
        console.log('[DEBUG] Session Role:', session?.user?.role);
        console.log('[DEBUG] isOwner evaluated:', isOwner);
        console.log('[DEBUG] canViewAll evaluated:', canViewAll);

        this.isOwnProfile = !canViewAll;

        if (this.isOwnProfile) {
          console.log('[DEBUG] Ruta tomada: PERFIL PROPIO');
          this.loadOwnProfile();
        } else {
          console.log('[DEBUG] Ruta tomada: TODOS LOS EMPLEADOS');
          this.loadEmployeesList();
        }
      },
      error: () => {
        // Fallback to simpler check if business fetch fails
        const isOwner = session?.user?.role === 'BusinessOwner' || session?.user?.role === 'Admin';
        const canViewAll = isOwner || this.authService.hasPermission('canViewEmployees');
        this.isOwnProfile = !canViewAll;

        console.log('[DEBUG] Fallback ruta de error isOwner:', isOwner);

        if (this.isOwnProfile) {
          this.loadOwnProfile();
        } else {
          this.loadEmployeesList();
        }
      }
    });
  }

  private loadOwnProfile(): void {
    this.ownerEmployeesService
      .getMyEmployeeProfile(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employee: OwnerEmployee) => {
          this.employees = [employee];
          this.isEmpty = false;
          this.loadServices();
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar perfil de empleado:', error);
          if (this.isHttpError(error, 404)) {
            this.notify.showError('No tienes un perfil de empleado en este negocio');
            this.employees = [];
            this.isEmpty = true;
          } else {
            this.notify.showError('No se pudo cargar tu perfil de empleado');
            this.employees = [];
            this.isEmpty = true;
          }
          this.loading = false;
        },
      });
  }

  private loadEmployeesList(): void {
    this.ownerEmployeesService
      .getByBusinessId(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees: OwnerEmployee[]) => {
          this.employees = employees;
          this.isEmpty = employees.length === 0;
          this.loadServices();
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al cargar empleados:', error);
          this.notify.showError('No se pudieron cargar los empleados del negocio');
          this.employees = [];
          this.isEmpty = true;
          this.loading = false;
        },
      });
  }

  private isHttpError(error: unknown, status: number): boolean {
    const maybeError = error as { status?: number };
    return maybeError?.status === status;
  }

  private loadServices(): void {
    this.ownerServicesService
      .getByBusinessId(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (services: OwnerService[]) => {
          this.availableServices = services.filter(s => s.isActive);
          this.buildServiceNameMap();
        },
        error: (error: unknown) => {
          console.error('Error al cargar servicios:', error);
          this.notify.showError('No se pudieron cargar los servicios');
        },
      });
  }
}




