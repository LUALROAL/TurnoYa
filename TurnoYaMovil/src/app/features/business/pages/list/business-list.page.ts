import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject, debounceTime, takeUntil } from "rxjs";
import { CityService } from "../../../city/services/city.service";
import type { CityAutocompleteResult } from "../../../city/services/city.service";
import { BusinessListItem } from "../../models";
import { BusinessService } from "../../services/business.service";

@Component({
  selector: "app-business-list",
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink],
  templateUrl: "./business-list.page.html",
  styleUrls: ["./business-list.page.scss"],
})
export class BusinessListPage implements OnInit, OnDestroy {
  private readonly cityService = inject(CityService);
  private readonly businessService = inject(BusinessService);
  private readonly destroy$ = new Subject<void>();
  private readonly filtersChange$ = new Subject<void>();

  // Sugerencias de ciudades
  protected citySuggestions: CityAutocompleteResult[] = [];
  protected showCitySuggestions = false;

  // Autocomplete de categorías
  protected categorySuggestions: string[] = [];
  protected showCategorySuggestions = false;

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

  // ===== MÉTODOS PARA AUTOCOMPLETE DE CIUDAD =====

  protected onCityFilterChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.cityFilter = value;

    if (value.length >= 1) {
      this.cityService.autocomplete(value).pipe(takeUntil(this.destroy$)).subscribe({
        next: (results: CityAutocompleteResult[]) => {
          this.citySuggestions = results;
          this.showCitySuggestions = true;
        },
        error: () => {
          this.citySuggestions = [];
          this.showCitySuggestions = false;
        }
      });
    } else {
      this.citySuggestions = [];
      this.showCitySuggestions = false;
      this.filtersChange$.next();
    }
  }

  protected selectCitySuggestion(suggestion: CityAutocompleteResult) {
    this.cityFilter = suggestion.name;
    this.showCitySuggestions = false;
    this.citySuggestions = [];
    this.filtersChange$.next();
  }

  protected hideCitySuggestionsWithDelay() {
    setTimeout(() => {
      this.showCitySuggestions = false;
    }, 200);
  }

  // ===== MÉTODOS PARA AUTOCOMPLETE DE CATEGORÍA =====

  protected onCategoryInput(value: string = ''): void {
    this.showCategorySuggestions = true;

    if (!value) {
      this.categorySuggestions = [...this.categories];
      return;
    }

    const searchTerm = value.toLowerCase();
    this.categorySuggestions = this.categories.filter(cat =>
      cat.toLowerCase().includes(searchTerm)
    );
  }

  protected onCategoryFocus(): void {
    this.showCategorySuggestions = true;
    this.categorySuggestions = [...this.categories];
  }

  protected onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.categorySuggestions = [];
    this.showCategorySuggestions = false;
    this.filtersChange$.next();
  }

  protected get filteredCategories(): string[] {
    return this.categorySuggestions;
  }

  // ===== MÉTODOS DE BÚSQUEDA =====

  protected onSearchQueryChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
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
    this.citySuggestions = [];
    this.categorySuggestions = [];
    this.showCitySuggestions = false;
    this.showCategorySuggestions = false;
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
          this.categorySuggestions = categories;
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

  // Método para obtener imágenes según la categoría
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
}
