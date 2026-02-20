import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  IonModal,
  IonButtons,
  IonIcon,
  IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, create, ban, checkmark } from 'ionicons/icons';
import { AdminUsersService, UserManageDto, PagedUsersResponseDto, UpdateUserStatusDto, UpdateUserRoleDto } from '../services/admin-users.service';
import { NotifyService } from '../../../core/services/notify.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonText,
    IonModal,
    IonButtons,
    IonIcon,
    IonInput,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Gestión de Usuarios</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Controles de búsqueda y filtros -->
      <div class="filter-section mb-4">
        <div class="mb-3">
          <ion-searchbar
            placeholder="Buscar por email, nombre..."
            (ionInput)="onSearchChange($event)"
            debounce="300"
            animated>
          </ion-searchbar>
        </div>

        <div class="filter-row gap-2">
          <ion-select
            placeholder="Filtrar por rol"
            [(ngModel)]="selectedRole"
            (ionChange)="onRoleFilterChange()">
            <ion-select-option value="">Todos los roles</ion-select-option>
            <ion-select-option value="Customer">Cliente</ion-select-option>
            <ion-select-option value="Owner">Propietario</ion-select-option>
            <ion-select-option value="Admin">Administrador</ion-select-option>
          </ion-select>

          <ion-button
            fill="outline"
            size="small"
            (click)="resetFilters()">
            Limpiar
          </ion-button>
        </div>
      </div>

      <!-- Estado vacío -->
      <div *ngIf="!loading() && users().length === 0" class="empty-state text-center py-8">
        <ion-text color="medium">
          <p>No se encontraron usuarios</p>
        </ion-text>
      </div>

      <!-- Spinner de carga -->
      <div *ngIf="loading()" class="flex justify-center py-8">
        <ion-spinner></ion-spinner>
      </div>

      <!-- Lista de usuarios -->
      <div *ngIf="!loading() && users().length > 0" class="users-list">
        <ion-card
          *ngFor="let user of users()"
          class="user-card mb-3">
          <ion-card-header>
            <div class="user-header-row">
              <div class="user-info">
                <ion-card-title class="text-base font-semibold">
                  {{ user.fullName }}
                </ion-card-title>
                <ion-text color="medium" class="text-sm">
                  {{ user.email }}
                </ion-text>
              </div>
              <div class="user-status">
                <ion-badge
                  [color]="getRoleColor(user.role)"
                  class="mr-2">
                  {{ getRoleLabel(user.role) }}
                </ion-badge>
                <ion-badge
                  [color]="user.isBlocked ? 'danger' : 'success'">
                  {{ user.isBlocked ? 'Bloqueado' : 'Activo' }}
                </ion-badge>
              </div>
            </div>
          </ion-card-header>

          <ion-card-content>
            <div class="user-details mb-3">
              <div class="detail-row">
                <span class="detail-label">Email verificado:</span>
                <ion-icon
                  [icon]="user.isEmailVerified ? checkmark : close"
                  [color]="user.isEmailVerified ? 'success' : 'danger'">
                </ion-icon>
              </div>
              <div class="detail-row">
                <span class="detail-label">Último acceso:</span>
                <span class="detail-value">
                  {{ user.lastLoginAt ? (user.lastLoginAt | date : 'short') : 'Nunca' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registrado:</span>
                <span class="detail-value">
                  {{ user.createdAt | date : 'short' }}
                </span>
              </div>
              <div *ngIf="user.isBlocked && user.blockReason" class="detail-row warning">
                <span class="detail-label">Razón del bloqueo:</span>
                <span class="detail-value">{{ user.blockReason }}</span>
              </div>
            </div>

            <!-- Acciones -->
            <div class="actions-row">
              <ion-button
                fill="outline"
                size="small"
                (click)="openEditModal(user)">
                <ion-icon slot="start" [icon]="create"></ion-icon>
                Editar
              </ion-button>

              <ion-button
                *ngIf="!user.isBlocked"
                fill="outline"
                size="small"
                color="danger"
                (click)="openBlockModal(user)">
                <ion-icon slot="start" [icon]="ban"></ion-icon>
                Bloquear
              </ion-button>

              <ion-button
                *ngIf="user.isBlocked"
                fill="outline"
                size="small"
                color="success"
                (click)="unblockUser(user)">
                <ion-icon slot="start" [icon]="checkmark"></ion-icon>
                Desbloquear
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Paginación -->
      <div *ngIf="!loading() && users().length > 0" class="pagination-section mt-4 text-center">
        <ion-text color="medium" class="text-sm">
          Página {{ currentPage() }} de {{ totalPages() }}
        </ion-text>
        <div class="flex justify-center gap-2 mt-2">
          <ion-button
            fill="outline"
            size="small"
            [disabled]="currentPage() === 1"
            (click)="previousPage()">
            Anterior
          </ion-button>
          <ion-button
            fill="outline"
            size="small"
            [disabled]="currentPage() >= totalPages()"
            (click)="nextPage()">
            Siguiente
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- Modal para editar usuario -->
    <ion-modal
      [isOpen]="editModalOpen()"
      (didDismiss)="closeEditModal()">
      <ng-template ionModalContent>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Editar Usuario</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeEditModal()">
                <ion-icon slot="icon-only" [icon]="close"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding" *ngIf="selectedUser()">
          <form [formGroup]="editForm" (ngSubmit)="saveUser()">
            <!-- Campo de rol -->
            <div class="mb-4">
              <ion-label class="block mb-2 font-semibold">Rol</ion-label>
              <ion-select
                formControlName="role"
                class="ion-padding-md">
                <ion-select-option value="Customer">Cliente</ion-select-option>
                <ion-select-option value="Owner">Propietario</ion-select-option>
                <ion-select-option value="Admin">Administrador</ion-select-option>
              </ion-select>
            </div>

            <!-- Botones de acción -->
            <div class="flex gap-2">
              <ion-button
                expand="block"
                color="primary"
                [disabled]="updatingUser()"
                (click)="saveUser()">
                <ion-spinner *ngIf="updatingUser()" slot="start"></ion-spinner>
                Guardar cambios
              </ion-button>
              <ion-button
                expand="block"
                fill="outline"
                (click)="closeEditModal()">
                Cancelar
              </ion-button>
            </div>
          </form>
        </ion-content>
      </ng-template>
    </ion-modal>

    <!-- Modal para bloquear usuario -->
    <ion-modal
      [isOpen]="blockModalOpen()"
      (didDismiss)="closeBlockModal()">
      <ng-template ionModalContent>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Bloquear Usuario</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeBlockModal()">
                <ion-icon slot="icon-only" [icon]="close"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding" *ngIf="selectedUser()">
          <form [formGroup]="blockForm" (ngSubmit)="confirmBlock()">
            <!-- Razón del bloqueo -->
            <div class="mb-4">
              <ion-label class="block mb-2 font-semibold">Razón del bloqueo</ion-label>
              <ion-input
                formControlName="blockReason"
                placeholder="Indique la razón (opcional)"
                class="ion-padding-md">
              </ion-input>
            </div>

            <!-- Fecha hasta bloquear -->
            <div class="mb-4">
              <ion-label class="block mb-2 font-semibold">Bloquear hasta (opcional)</ion-label>
              <ion-input
                formControlName="blockUntil"
                type="datetime-local"
                class="ion-padding-md">
              </ion-input>
            </div>

            <!-- Botones de acción -->
            <div class="flex gap-2">
              <ion-button
                expand="block"
                color="danger"
                [disabled]="updatingUser()"
                (click)="confirmBlock()">
                <ion-spinner *ngIf="updatingUser()" slot="start"></ion-spinner>
                Bloquear Usuario
              </ion-button>
              <ion-button
                expand="block"
                fill="outline"
                (click)="closeBlockModal()">
                Cancelar
              </ion-button>
            </div>
          </form>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .filter-section {
      background: var(--ion-background-color-step-50);
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .filter-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    ion-select {
      flex: 1;
    }

    .user-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .user-info {
      flex: 1;
    }

    .user-status {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .user-details {
      background: var(--ion-background-color-step-50);
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--ion-background-color-step-100);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row.warning {
      background: rgba(255, 165, 0, 0.1);
      padding: 0.5rem;
      border-radius: 0.25rem;
    }

    .detail-label {
      font-weight: 600;
      min-width: 120px;
    }

    .detail-value {
      text-align: right;
      color: var(--ion-text-color-step-500);
    }

    .actions-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .actions-row ion-button {
      flex: 1;
      min-width: 120px;
    }

    .pagination-section {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    .mb-2 {
      margin-bottom: 0.5rem;
    }

    .mb-3 {
      margin-bottom: 0.75rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }

    .mr-2 {
      margin-right: 0.5rem;
    }

    .flex {
      display: flex;
    }

    .justify-center {
      justify-content: center;
    }

    .justify-between {
      justify-content: space-between;
    }

    .text-center {
      text-align: center;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    .text-base {
      font-size: 1rem;
    }

    .font-semibold {
      font-weight: 600;
    }

    .py-8 {
      padding-top: 2rem;
      padding-bottom: 2rem;
    }
  `]
})
export class AdminUsersPage implements OnInit {
  // Iconos públicos para template
  create = create;
  close = close;
  ban = ban;
  checkmark = checkmark;

  // Signals para gestión de estado
  users = signal<UserManageDto[]>([]);
  loading = signal(false);
  updatingUser = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = signal(10);

  // Modales
  editModalOpen = signal(false);
  blockModalOpen = signal(false);
  selectedUser = signal<UserManageDto | null>(null);

  // Filtros
  searchTerm = '';
  selectedRole = '';

  // Formularios
  editForm!: FormGroup;
  blockForm!: FormGroup;

  constructor(
    private adminUsersService: AdminUsersService,
    private notify: NotifyService,
    private fb: FormBuilder
  ) {
    addIcons({ create, close, ban, checkmark });
  }

  ngOnInit() {
    this.initializeForms();
    this.loadUsers();
  }

  /**
   * Inicializa los formularios reactivos
   */
  private initializeForms() {
    this.editForm = this.fb.group({
      role: ['']
    });

    this.blockForm = this.fb.group({
      blockReason: [''],
      blockUntil: ['']
    });
  }

  /**
   * Carga la lista de usuarios
   */
  private loadUsers() {
    this.loading.set(true);
    this.adminUsersService
      .searchUsers(
        this.searchTerm || undefined,
        this.selectedRole || undefined,
        this.currentPage(),
        this.pageSize()
      )
      .subscribe({
        next: (response: PagedUsersResponseDto) => {
          this.users.set(response.users);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: (error) => {
          this.notify.showError('Error al cargar usuarios');
          this.loading.set(false);
        }
      });
  }

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.currentPage.set(1);
    this.loadUsers();
  }

  /**
   * Maneja el cambio del filtro de rol
   */
  onRoleFilterChange() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  /**
   * Limpia los filtros
   */
  resetFilters() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.currentPage.set(1);
    this.loadUsers();
  }

  /**
   * Pasa a la página anterior
   */
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadUsers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pasa a la siguiente página
   */
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadUsers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Abre el modal para editar usuario
   */
  openEditModal(user: UserManageDto) {
    this.selectedUser.set(user);
    this.editForm.patchValue({
      role: user.role
    });
    this.editModalOpen.set(true);
  }

  /**
   * Cierra el modal de edición
   */
  closeEditModal() {
    this.editModalOpen.set(false);
    this.selectedUser.set(null);
    this.editForm.reset();
  }

  /**
   * Guarda los cambios del usuario
   */
  saveUser() {
    if (!this.selectedUser() || !this.editForm.valid) {
      return;
    }

    const newRole = this.editForm.get('role')?.value;
    if (newRole === this.selectedUser()?.role) {
      this.notify.showError('El rol no ha sido modificado');
      return;
    }

    this.updatingUser.set(true);
    this.adminUsersService
      .updateUserRole(this.selectedUser()!.id, { role: newRole })
      .subscribe({
        next: () => {
          this.notify.showSuccess('Usuario actualizado correctamente');
          this.closeEditModal();
          this.loadUsers();
          this.updatingUser.set(false);
        },
        error: (error) => {
          this.notify.showError('Error al actualizar el usuario');
          this.updatingUser.set(false);
        }
      });
  }

  /**
   * Abre el modal para bloquear usuario
   */
  openBlockModal(user: UserManageDto) {
    this.selectedUser.set(user);
    this.blockForm.reset();
    this.blockModalOpen.set(true);
  }

  /**
   * Cierra el modal de bloqueo
   */
  closeBlockModal() {
    this.blockModalOpen.set(false);
    this.selectedUser.set(null);
    this.blockForm.reset();
  }

  /**
   * Confirma el bloqueo del usuario
   */
  confirmBlock() {
    if (!this.selectedUser()) {
      return;
    }

    this.updatingUser.set(true);
    const blockData: UpdateUserStatusDto = {
      isBlocked: true,
      blockReason: this.blockForm.get('blockReason')?.value || undefined,
      blockUntil: this.blockForm.get('blockUntil')?.value || undefined
    };

    this.adminUsersService
      .updateUserStatus(this.selectedUser()!.id, blockData)
      .subscribe({
        next: () => {
          this.notify.showSuccess('Usuario bloqueado correctamente');
          this.closeBlockModal();
          this.loadUsers();
          this.updatingUser.set(false);
        },
        error: (error) => {
          this.notify.showError('Error al bloquear el usuario');
          this.updatingUser.set(false);
        }
      });
  }

  /**
   * Desbloquea un usuario
   */
  unblockUser(user: UserManageDto) {
    this.updatingUser.set(true);
    const unblockData: UpdateUserStatusDto = {
      isBlocked: false
    };

    this.adminUsersService
      .updateUserStatus(user.id, unblockData)
      .subscribe({
        next: () => {
          this.notify.showSuccess('Usuario desbloqueado correctamente');
          this.loadUsers();
          this.updatingUser.set(false);
        },
        error: (error) => {
          this.notify.showError('Error al desbloquear el usuario');
          this.updatingUser.set(false);
        }
      });
  }

  /**
   * Retorna el color del badge del rol
   */
  getRoleColor(role: string): string {
    switch (role) {
      case 'Admin':
        return 'danger';
      case 'Owner':
        return 'warning';
      default:
        return 'primary';
    }
  }

  /**
   * Retorna la etiqueta del rol en español
   */
  getRoleLabel(role: string): string {
    switch (role) {
      case 'Admin':
        return 'Administrador';
      case 'Owner':
        return 'Propietario';
      case 'Customer':
        return 'Cliente';
      default:
        return role;
    }
  }
}
