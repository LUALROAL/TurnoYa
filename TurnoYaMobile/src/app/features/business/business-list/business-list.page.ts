import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonSkeletonText
} from '@ionic/angular/standalone';
// import { addIcons } ... removed, handled globally in main.ts

import { BusinessService } from '../../../core/services/business.service';
import { Business } from '../../../core/models';

@Component({
  selector: 'app-business-list',
  templateUrl: './business-list.page.html',
  styleUrls: ['./business-list.page.scss'],
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
    IonSearchbar,
    IonButton,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSkeletonText,
    IonFab,
    IonFabButton
  ]
})
export class BusinessListPage implements OnInit {
  businesses: Business[] = [];
  allBusinesses: Business[] = [];
  isLoading = false;
  searchTerm = '';
  selectedCategory = '';
  availableCategories: string[] = [];
  currentPage = 1;
  pageSize = 10;
  hasMore = true;

  constructor(
    private businessService: BusinessService,
    private router: Router
  ) {
    // Icons are now global
  }

  ngOnInit() {
    this.loadBusinesses();
    this.loadCategories();
  }

  loadCategories() {
    this.businessService.getCategories().subscribe({
      next: (response) => {
        const data = (response as any)?.data ?? response;
        this.availableCategories = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.availableCategories = [];
      }
    });
  }

  async loadBusinesses(reset: boolean = false) {
    if (reset) {
      this.currentPage = 1;
      this.businesses = [];
      this.allBusinesses = [];
      this.hasMore = true;
    }

    if (!this.hasMore) return;

    this.isLoading = true;

    this.businessService.getBusinesses(
      this.currentPage,
      this.pageSize,
      this.searchTerm
    ).subscribe({
      next: (response: any) => {
        let rawData: any[] = [];

        if (Array.isArray(response)) {
          rawData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          rawData = response.data;
        } else if (response?.items && Array.isArray(response.items)) {
          rawData = response.items;
        } else if (response?.result && Array.isArray(response.result)) {
          rawData = response.result;
        } else if (response && (response.id || response.name)) {
          rawData = [response];
        }

        const mappedBusinesses: Business[] = rawData.map(item => ({
          id: item.id || item._id,
          name: item.name || item.nombre || 'Negocio sin nombre',
          description: item.description || item.descripcion,
          category: item.category || item.categoria || 'General',
          address: item.address || item.direccion || '',
          city: item.city || item.ciudad || '',
          department: item.department || item.departamento || '',
          phone: item.phone || item.telefono,
          email: item.email,
          website: item.website || item.sitioWeb,
          latitude: item.latitude || item.latitud,
          longitude: item.longitude || item.longitud,
          averageRating: item.averageRating || item.rating || 0,
          totalReviews: item.totalReviews || 0,
          isActive: item.isActive ?? true,
          createdAt: item.createdAt || new Date().toISOString(),
          ownerId: item.ownerId || '',
          ownerName: item.ownerName || ''
        })).filter(b => b.id);

        if (reset) {
          this.allBusinesses = mappedBusinesses;
        } else {
          const existingIds = new Set(this.allBusinesses.map(b => b.id));
          const newUnique = mappedBusinesses.filter(b => !existingIds.has(b.id));
          this.allBusinesses = [...this.allBusinesses, ...newUnique];
        }

        this.applyFilters();

        if (response && typeof response.totalPages === 'number') {
          this.hasMore = this.currentPage < response.totalPages;
        } else {
          this.hasMore = mappedBusinesses.length >= this.pageSize;
        }

        this.isLoading = false;
      },
      error: async (error) => {
        console.error('Error loading businesses:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allBusinesses];
    const term = this.searchTerm.trim().toLowerCase();

    if (term.length >= 2) {
      filtered = filtered.filter(b => (
        (b.name?.toLowerCase().includes(term)) ||
        (b.category?.toLowerCase().includes(term)) ||
        (b.city?.toLowerCase().includes(term))
      ));
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(b => b.category === this.selectedCategory);
    }

    this.businesses = filtered;
  }

  onSearch(event: any) {
    const value = (event?.target?.value ?? '').trim();
    this.searchTerm = value;
    this.applyFilters();
    if (value.length >= 2) {
      this.loadBusinesses(true);
    }
  }

  onCategorySelect(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  clearCategory() {
    this.selectedCategory = '';
    this.applyFilters();
  }

  onLoadMore(event: any) {
    this.currentPage++;
    this.loadBusinesses().then(() => {
      event.target.complete();
    });
  }

  viewBusinessDetail(businessId: string) {
    this.router.navigate(['/business/detail', businessId]);
  }

  createBusiness() {
    this.router.navigate(['/business/form']);
  }

  trackByBusinessId(_: number, business: Business) {
    return business.id;
  }
}
