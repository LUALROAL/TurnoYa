import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject, takeUntil } from "rxjs";

import { BusinessDetail } from "../../models";
import { BusinessService } from "../../services/business.service";

@Component({
  selector: "app-business-detail",
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: "./business-detail.page.html",
  styleUrls: ["./business-detail.page.scss"],
})
export class BusinessDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly businessService = inject(BusinessService);
  private readonly destroy$ = new Subject<void>();

  protected loading = true;
  protected business: BusinessDetail | null = null;

  ngOnInit() {
    this.loadBusinessDetail();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected trackByServiceId(_: number, service: { id: string }) {
    return service.id;
  }

  protected trackByEmployeeId(_: number, employee: { id: string }) {
    return employee.id;
  }

  protected getBusinessImage(category: string): string {
    const images = {
      'Peluquería': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=3274&auto=format&fit=crop',
      'Bienestar': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=3270&auto=format&fit=crop',
      'Salud': 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=3270&auto=format&fit=crop',
      'Electrónica': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=3301&auto=format&fit=crop',
      'default': 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=3271&auto=format&fit=crop'
    };

    return images[category as keyof typeof images] || images.default;
  }

  private loadBusinessDetail() {
    const businessId = this.route.snapshot.paramMap.get("id");

    if (!businessId) {
      this.loading = false;
      return;
    }

    this.loading = true;

    this.businessService
      .getById(businessId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (business: BusinessDetail) => {
          this.business = business;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
