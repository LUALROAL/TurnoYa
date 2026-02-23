import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  callOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  createOutline,
  mailOutline,
  personOutline,
  peopleOutline,
  trashOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { NotifyService } from '../../../../core/services/notify.service';
import { OwnerEmployee } from '../../models';
import { OwnerEmployeesService } from '../../services/owner-employees.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  templateUrl: './employees-list.page.html',
  styleUrl: './employees-list.page.scss',
})
export class EmployeesListPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly ownerEmployeesService = inject(OwnerEmployeesService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  protected businessId = '';
  protected loading = true;
  protected isEmpty = false;
  protected employees: OwnerEmployee[] = [];

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
          this.notify.showError('No se pudo cambiar el estado del empleado');
        },
      });
  }

  protected deleteEmployee(employee: OwnerEmployee): void {
    const confirmed = confirm(
      `¿Estás seguro de eliminar al empleado "${employee.firstName} ${employee.lastName}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

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
          this.notify.showError('No se pudo eliminar el empleado');
        },
      });
  }

  private loadEmployees(): void {
    this.loading = true;

    this.ownerEmployeesService
      .getByBusinessId(this.businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees: OwnerEmployee[]) => {
          this.employees = employees;
          this.isEmpty = employees.length === 0;
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
}
