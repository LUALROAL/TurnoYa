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
    console.log('🚀 BusinessListPage inicializada');
    console.log('📍 Current URL:', this.router.url);
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
    console.log('📊 loadBusinesses() ejecutándose...');
    console.log('🔄 Reset:', reset);

    if (reset) {
      this.currentPage = 1;
      this.businesses = [];
      this.allBusinesses = [];
      this.hasMore = true;
    }

    if (!this.hasMore) {
      return;
    }

    this.isLoading = true;

    this.businessService.getBusinesses(
      this.currentPage,
      this.pageSize,
      this.searchTerm
    ).subscribe({
      next: (response) => {
        console.log('✅ Response raw:', JSON.stringify(response));

        let businessData: any[] = [];

        // Estrategia de extracción de datos en cascada
        if (Array.isArray(response)) {
          businessData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          businessData = response.data;
        } else if (response?.items && Array.isArray(response.items)) {
          businessData = response.items;
        } else if (response?.result && Array.isArray(response.result)) {
          businessData = response.result;
        } else if (typeof response === 'object' && response !== null) {
          // Último recurso: intentar envolver el objeto si parece ser un solo negocio
          businessData = [response];
        }

        console.log(`✅ Datos extraídos (Count: ${businessData.length})`);

        if (reset) {
          this.allBusinesses = businessData;
          this.loadCategories();
        } else {
          this.allBusinesses = [...this.allBusinesses, ...businessData];
        }

        this.applyFilters();

        // Lógica de paginación
        if (response && response.totalPages) {
          this.hasMore = this.currentPage < response.totalPages;
        } else {
          // Si devolvió menos del pageSize, probablemente no hay más
          this.hasMore = businessData.length >= this.pageSize;
        }

        this.isLoading = false;
      },
      error: async (error) => {
        console.error('❌ Error loading businesses:', error);
        this.isLoading = false;

        let msg = 'Error desconocido al cargar negocios.';
        if (error.status === 401) {
          msg = 'Tu sesión ha expirado.';
          this.router.navigate(['/login']);
        } else if (error.status === 0) {
          msg = 'No se puede conectar con el servidor.';
        }

        await this.showToast(msg, 'danger');
      }
    });
  }

  applyFilters() {
    console.log('🔍 applyFilters() ejecutándose...');
    console.log('📦 allBusinesses length:', this.allBusinesses.length);
    console.log('🔍 searchTerm:', this.searchTerm);
    console.log('🏷️ selectedCategory:', this.selectedCategory);

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
      console.log('✅ Después del filtro de búsqueda:', filtered.length);
    }

    // Filtro por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(b => b.category === this.selectedCategory);
      console.log('✅ Después del filtro de categoría:', filtered.length);
    }

    this.businesses = filtered;
    console.log('✅ businesses final length:', this.businesses.length);
    console.log('✅ businesses array:', this.businesses);
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
