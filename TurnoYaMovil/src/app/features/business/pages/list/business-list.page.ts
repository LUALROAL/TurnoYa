import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject, debounceTime, takeUntil } from "rxjs";

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
  private readonly filtersChange$ = new Subject<void>();

  protected loading = true;
  protected searching = false;
  protected businesses: BusinessListItem[] = [];
  protected categories: string[] = [];
  protected searchQuery = "";
  protected cityFilter = "";
  protected selectedCategory = "";

  ngOnInit() {
    this.setupDebouncedFilters();
    this.loadCategories();
    this.loadBusinesses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected trackByBusinessId(_: number, business: BusinessListItem) {
    return business.id;
  }

  protected onSearchQueryChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searching = true;
    this.filtersChange$.next();
  }

  protected onCityFilterChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.cityFilter = target.value;
    this.searching = true;
    this.filtersChange$.next();
  }

  protected selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? "" : category;
    this.searching = true;
    this.filtersChange$.next();
  }

  protected applyFilters() {
    this.searching = true;
    this.executeSearch();
  }

  protected clearFilters() {
    this.searchQuery = "";
    this.cityFilter = "";
    this.selectedCategory = "";
    this.searching = false;
    this.loadBusinesses();
  }

  protected isCategoryActive(category: string) {
    return this.selectedCategory === category;
  }

  private setupDebouncedFilters() {
    this.filtersChange$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.searchQuery.trim() && !this.cityFilter.trim() && !this.selectedCategory) {
          this.searching = false;
          this.loadBusinesses();
          return;
        }

        this.executeSearch();
      });
  }

  private executeSearch() {
    this.loading = true;

    this.businessService
      .search({
        query: this.searchQuery.trim() || undefined,
        city: this.cityFilter.trim() || undefined,
        category: this.selectedCategory || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (businesses: BusinessListItem[]) => {
          this.businesses = businesses.filter((business: BusinessListItem) => business.isActive);
          this.searching = false;
          this.loading = false;
        },
        error: () => {
          this.searching = false;
          this.loading = false;
        },
      });
  }

  private loadCategories() {
    this.businessService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: string[]) => {
          this.categories = categories;
        },
      });
  }

  private loadBusinesses() {
    this.loading = true;
    this.searching = false;

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
