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
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonLabel,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  locationOutline,
  timeOutline,
  starOutline,
  callOutline,
  pricetagOutline,
  pricetag,
  businessOutline,
  closeCircle,
  funnelOutline
} from 'ionicons/icons';
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
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonLabel
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
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      add,
      locationOutline,
      timeOutline,
      starOutline,
      callOutline,
      pricetagOutline,
      pricetag,
      businessOutline,
      closeCircle,
      funnelOutline
    });
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
      next: (response) => {
        console.log('Response from backend:', response);
        console.log('Type of response:', typeof response);
        console.log('Is array?', Array.isArray(response));

        // El backend puede devolver directamente un array o un ApiResponse
        let businessData: any[] = [];

        if (Array.isArray(response)) {
          // Respuesta directa como array
          businessData = response;
        } else if (response && response.data) {
          // Respuesta como ApiResponse con propiedad data
          businessData = Array.isArray(response.data) ? response.data : [response.data];
        }

        console.log('Business data to display:', businessData);
        console.log('Number of businesses:', businessData.length);

        // Mantener una copia completa para filtros locales
        if (reset) {
          this.allBusinesses = businessData;
          // Recargar categorías cuando se refrescan los negocios
          this.loadCategories();
        } else {
          this.allBusinesses = [...this.allBusinesses, ...businessData];
        }

        // Aplicar filtros locales
        this.applyFilters();

        // Si tiene paginación, usar totalPages, sino determinar por cantidad de datos
        if (response && response.totalPages) {
          this.hasMore = this.currentPage < response.totalPages;
        } else {
          // Si no hay paginación o llegaron menos registros que el pageSize, no hay más
          this.hasMore = businessData.length >= this.pageSize;
        }

        console.log('Total businesses in array:', this.businesses.length);
        console.log('Has more pages?', this.hasMore);
        this.isLoading = false;
      },
      error: async (error) => {
        console.error('Error loading businesses:', error);
        this.isLoading = false;
        await this.showToast('Error al cargar negocios', 'danger');
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allBusinesses];

    // Filtro por búsqueda de texto
    const term = this.searchTerm.trim().toLowerCase();
    if (term.length >= 2) {
      filtered = filtered.filter(b => (
        (b.name?.toLowerCase().includes(term)) ||
        (b.category?.toLowerCase().includes(term)) ||
        (b.city?.toLowerCase().includes(term)) ||
        (b.address?.toLowerCase().includes(term))
      ));
    }

    // Filtro por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(b => b.category === this.selectedCategory);
    }

    this.businesses = filtered;
  }

  onSearch(event: any) {
    const value = (event?.target?.value ?? '').trim();
    this.searchTerm = value;
    this.applyFilters();

    // Además refrescar desde backend si hay término
    if (value.length >= 2) {
      this.loadBusinesses(true);
    }
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event?.detail?.value ?? '';
    this.applyFilters();
  }

  onCategorySelect(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  clearCategory() {
    this.selectedCategory = '';
    this.applyFilters();
  }

  async onRefresh(event: any) {
    await this.loadBusinesses(true);
    event.target.complete();
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

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
