import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models';

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.page.html',
  styleUrls: ['./appointments-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent
  ]
})
export class AppointmentsListPage implements OnInit {
  isLoading = false;
  status = 'Upcoming';
  appointments: Appointment[] = [];

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getMyAppointments(this.status).subscribe({
      next: (data) => {
        this.appointments = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onStatusChange(ev: any) {
    this.status = ev?.detail?.value ?? 'Upcoming';
    this.loadAppointments();
  }

  viewDetail(id: string) {
    this.router.navigate(['/appointments/detail', id]);
  }

  handleRefresh(event: any) {
    this.appointmentService.getMyAppointments(this.status).subscribe({
      next: (data) => {
        this.appointments = data || [];
        event.target.complete();
      },
      error: () => {
        event.target.complete();
      }
    });
  }
}
