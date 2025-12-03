import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
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
  selector: 'app-business-appointments',
  templateUrl: './business-appointments.page.html',
  styleUrls: ['./business-appointments.page.scss'],
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
export class BusinessAppointmentsPage implements OnInit {
  isLoading = false;
  status = 'Upcoming';
  appointments: Appointment[] = [];
  businessId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.loadAppointments();
  }

  loadAppointments() {
    if (!this.businessId) return;
    this.isLoading = true;
    this.appointmentService.getBusinessAppointments(this.businessId, this.status).subscribe({
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

  handleRefresh(event: any) {
    this.appointmentService.getBusinessAppointments(this.businessId, this.status).subscribe({
      next: (data) => {
        this.appointments = data || [];
        event.target.complete();
      },
      error: () => {
        event.target.complete();
      }
    });
  }

  viewDetail(id: string) {
    this.router.navigate(['/appointments/detail', id]);
  }
}
