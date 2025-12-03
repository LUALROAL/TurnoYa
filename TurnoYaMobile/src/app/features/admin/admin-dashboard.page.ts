import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonList,
  IonBadge,
  IonSearchbar,
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserRole, User } from '../../core/models';
import { environment } from '../../../environments/environment';

interface PagedUsersResponse {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonList,
    IonBadge,
    IonSearchbar,
    IonSpinner
  ]
})
export class AdminDashboardPage implements OnInit {
  searchTerm: string = '';
  users: User[] = [];
  loading: boolean = false;
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;

  roleOptions = [
    { value: UserRole.Customer, label: 'Customer' },
    { value: UserRole.BusinessOwner, label: 'BusinessOwner' },
    { value: UserRole.Employee, label: 'Employee' },
    { value: UserRole.Admin, label: 'Admin' }
  ];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      const params: any = {
        page: this.page,
        pageSize: this.pageSize
      };

      if (this.searchTerm) {
        params.searchTerm = this.searchTerm;
      }

      const response = await this.http.get<PagedUsersResponse>(
        `${environment.apiUrl}/Admin/users`,
        { params }
      ).toPromise();

      if (response) {
        this.users = response.users;
        this.totalPages = response.totalPages;
      }
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al cargar usuarios',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.page = 1;
    await this.loadUsers();
  }

  async changeUserRole(user: User, newRole: UserRole) {
    const loading = await this.loadingController.create({
      message: 'Actualizando rol...'
    });
    await loading.present();

    try {
      await this.http.patch(
        `${environment.apiUrl}/Auth/users/${user.id}/role`,
        { role: newRole }
      ).toPromise();

      const toast = await this.toastController.create({
        message: `Rol de ${user.firstName} actualizado a ${newRole}`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      // Recargar usuarios
      await this.loadUsers();
    } catch (err: any) {
      const toast = await this.toastController.create({
        message: err?.error?.message || 'Error al actualizar rol',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case UserRole.Admin:
        return 'danger';
      case UserRole.BusinessOwner:
        return 'primary';
      case UserRole.Employee:
        return 'secondary';
      default:
        return 'medium';
    }
  }
}
