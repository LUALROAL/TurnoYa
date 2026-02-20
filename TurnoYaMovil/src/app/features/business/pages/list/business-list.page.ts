import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject, takeUntil } from "rxjs";

import { BusinessListItem } from "../../models";
import { BusinessService } from "../../services/business.service";

@Component({
  selector: "app-business-list",
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: "./business-list.page.html",
  styleUrls: ["./business-list.page.scss"],
})
export class BusinessListPage implements OnInit, OnDestroy {
  private readonly businessService = inject(BusinessService);
  private readonly destroy$ = new Subject<void>();

  protected loading = true;
  protected businesses: BusinessListItem[] = [];

  ngOnInit() {
    this.loadBusinesses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected trackByBusinessId(_: number, business: BusinessListItem) {
    return business.id;
  }

  private loadBusinesses() {
    this.loading = true;

    this.businessService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (businesses: BusinessListItem[]) => {
          this.businesses = businesses.filter((business: BusinessListItem) => business.isActive);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
