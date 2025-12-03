import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/angular/standalone';
import { BusinessService } from '../../../core/services/business.service';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.page.html',
  styleUrls: ['./employee-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonSpinner
  ]
})
export class EmployeeListPage implements OnInit {
  isLoading = false;
  businessId = '';
  employees: any[] = [];

  constructor(private route: ActivatedRoute, private businessService: BusinessService) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.load();
  }

  load() {
    this.isLoading = true;
    this.businessService.getBusinessEmployees(this.businessId).subscribe({
      next: (data: any) => {
        this.employees = Array.isArray(data) ? data : ((data as any)?.data || []);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  handleRefresh(ev: any) {
    this.businessService.getBusinessEmployees(this.businessId).subscribe({
      next: (data: any) => {
        this.employees = Array.isArray(data) ? data : ((data as any)?.data || []);
        ev.target.complete();
      },
      error: () => ev.target.complete()
    });
  }
}
