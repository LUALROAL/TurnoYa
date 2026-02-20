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
