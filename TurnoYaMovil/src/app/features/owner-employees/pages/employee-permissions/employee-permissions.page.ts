import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { NotifyService } from '../../../../core/services/notify.service';
import { EmployeePermissions, ProfessionalService } from 'src/app/features/professional/services/professional.service';
import { OwnerEmployeesService } from '../../services/owner-employees.service';

@Component({
  selector: 'app-employee-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  templateUrl: './employee-permissions.page.html',
  styleUrls: ['./employee-permissions.page.scss']
})
export class EmployeePermissionsPage implements OnInit {
  employeeId = '';
  employeeName = 'Empleado';
  loading = true;
  permissions: EmployeePermissions = {
    employeeId: '',
    canViewAppointments: true,
    canAcceptAppointments: false,
    canRejectAppointments: false,
    canCancelAppointments: false,
    canRescheduleAppointments: false,
    canManageSchedule: false,
    canViewServices: true,
    canManageServices: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private professionalService: ProfessionalService,
    private ownerEmployeesService: OwnerEmployeesService,
    private notify: NotifyService
  ) { }

  ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('employeeId') || '';
    this.loadPermissions();
  }

  loadPermissions() {
    this.professionalService.getPermissions(this.employeeId).subscribe({
      next: (perms) => {
        this.permissions = perms;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.ownerEmployeesService.getById(this.employeeId).subscribe({
      next: (emp: any) => {
        if (emp) {
          this.employeeName = `${emp.firstName} ${emp.lastName}`;
        }
      }
    });
  }

  savePermissions() {
    this.professionalService.updatePermissions(this.employeeId, this.permissions).subscribe({
      next: () => {
        this.notify.showSuccess('Permisos actualizados');
      },
      error: () => {
        this.notify.showError('Error al guardar permisos');
      }
    });
  }

  goBack() {
    this.router.navigate(['/owner/businesses', this.route.snapshot.paramMap.get('businessId'), 'employees']);
  }
}
