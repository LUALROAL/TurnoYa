import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProfessionalService, EmployeeAppointment } from '../../services/professional.service';

@Component({
  selector: 'app-professional-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class ProfessionalHomePage implements OnInit {
  loading = true;
  todayAppointments: EmployeeAppointment[] = [];
  upcomingCount = 0;
  canAccept = true;
  canReject = true;

  constructor(private professionalService: ProfessionalService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0] + 'T23:59:59';

    this.professionalService.getMyAppointments(from, to).subscribe({
      next: (appointments) => {
        this.todayAppointments = appointments;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    this.professionalService.getMyAppointments(today.toISOString(), futureDate.toISOString()).subscribe({
      next: (appointments) => {
        this.upcomingCount = appointments.length;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Pending': 'Pendiente',
      'Confirmed': 'Confirmada',
      'Completed': 'Completada',
      'Cancelled': 'Cancelada',
      'NoShow': 'No se presentó'
    };
    return labels[status] || status;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  acceptAppointment(appointment: EmployeeAppointment) {
    console.log('Accept appointment:', appointment.id);
  }

  rejectAppointment(appointment: EmployeeAppointment) {
    console.log('Reject appointment:', appointment.id);
  }
}
