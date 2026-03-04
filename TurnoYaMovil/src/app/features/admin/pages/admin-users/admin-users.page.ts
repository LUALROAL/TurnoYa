import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  IonContent,
  IonSpinner,
  IonModal,
  IonIcon,
  IonPopover,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  create,
  ban,
  checkmark,
  arrowBack,
  searchOutline,
  funnelOutline,
  chevronDownOutline,
  createOutline,
  banOutline,
  checkmarkCircleOutline,
  closeOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkCircle,
  closeCircle,
} from 'ionicons/icons';
import { AdminUsersService } from '../../services/admin-users.service';
import {
  UserManageDto,
  PagedUsersResponseDto,
  UpdateUserStatusDto,
} from '../../models/admin-users.models';
import { NotifyService } from '../../../../core/services/notify.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonSpinner,
    IonModal,
    IonIcon,
    IonPopover,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
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

  // Popover
  @ViewChild('rolePopover') rolePopover!: IonPopover;

  constructor(
    private adminUsersService: AdminUsersService,
    private notify: NotifyService,
    private fb: FormBuilder,
    private location: Location
  ) {
    addIcons({
      close,
      create,
      ban,
      checkmark,
      arrowBack,
      searchOutline,
      funnelOutline,
      chevronDownOutline,
      createOutline,
      banOutline,
      checkmarkCircleOutline,
      closeOutline,
      calendarOutline,
      chatbubbleOutline,
      checkmarkCircle,
      closeCircle,
    });
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
      role: [''],
    });

    this.blockForm = this.fb.group({
      blockReason: [''],
      blockUntil: [''],
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
        error: () => {
          this.notify.showError('Error al cargar usuarios');
          this.loading.set(false);
        },
      });
  }

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  onSearchChange(event: any) {
    this.searchTerm = event.target.value || '';
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

  // ========== MÉTODOS DEL POPOVER ==========
  async openRolePopover(event: any) {
    this.rolePopover.event = event;
    await this.rolePopover.present();
  }

  selectRole(role: string) {
    this.selectedRole = role;
    this.rolePopover.dismiss();
    this.onRoleFilterChange();
  }

  getSelectedRoleLabel(): string {
    if (!this.selectedRole) return 'Filtrar por rol';
    switch (this.selectedRole) {
      case 'Customer':
        return 'Cliente';
      case 'Owner':
        return 'Propietario';
      case 'Admin':
        return 'Administrador';
      default:
        return this.selectedRole;
    }
  }

  /**
   * Abre el modal para editar usuario
   */
  openEditModal(user: UserManageDto) {
    this.selectedUser.set(user);
    this.editForm.patchValue({
      role: user.role,
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
        error: () => {
          this.notify.showError('Error al actualizar el usuario');
          this.updatingUser.set(false);
        },
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
      blockUntil: this.blockForm.get('blockUntil')?.value || undefined,
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
        error: () => {
          this.notify.showError('Error al bloquear el usuario');
          this.updatingUser.set(false);
        },
      });
  }

  /**
   * Desbloquea un usuario
   */
  unblockUser(user: UserManageDto) {
    this.updatingUser.set(true);
    const unblockData: UpdateUserStatusDto = {
      isBlocked: false,
    };

    this.adminUsersService
      .updateUserStatus(user.id, unblockData)
      .subscribe({
        next: () => {
          this.notify.showSuccess('Usuario desbloqueado correctamente');
          this.loadUsers();
          this.updatingUser.set(false);
        },
        error: () => {
          this.notify.showError('Error al desbloquear el usuario');
          this.updatingUser.set(false);
        },
      });
  }

  /**
   * Retorna el color del badge del rol (se usa para clases, ahora manejado por ngClass)
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

  /**
   * Navega hacia atrás
   */
  goBack() {
    this.location.back();
  }
}
