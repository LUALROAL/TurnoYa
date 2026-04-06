import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ProfessionalService, EmployeeAppointment } from '../../services/professional.service';

@Component({
  selector: 'app-professional-appointments',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './appointments.page.html',
  styleUrls: ['./appointments.page.scss']
})
export class ProfessionalAppointmentsPage implements OnInit {
  loading = true;
  appointments: EmployeeAppointment[] = [];

  constructor(private professionalService: ProfessionalService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.professionalService.getMyAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Pending': 'Pendiente',
      'Confirmed': 'Confirmada',
      'Completed': 'Completada',
      'Cancelled': 'Cancelada',
    };
    return labels[status] || status;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  }
}
