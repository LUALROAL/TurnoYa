import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject, takeUntil } from "rxjs";

import { BusinessDetail, BusinessEmployeeItem, BusinessServiceItem } from "../../models";
import { BusinessService } from "../../services/business.service";
import { addIcons } from "ionicons";
import { arrowBackOutline, checkmarkCircleOutline } from "ionicons/icons";

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

  // Listas originales
  protected services: BusinessServiceItem[] = [];
  protected employees: BusinessEmployeeItem[] = [];

  // Listas filtradas
  protected filteredServices: BusinessServiceItem[] = [];
  protected filteredEmployees: BusinessEmployeeItem[] = [];
  protected selectedServiceFilter: string = '';
  protected selectedEmployeeFilter: string = '';

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    this.loadBusinessDetail();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected trackByServiceId(_: number, service: BusinessServiceItem) {
    return service.id;
  }

  protected trackByEmployeeId(_: number, employee: BusinessEmployeeItem) {
    return employee.id;
  }

  /**
   * Devuelve el src correcto para el logo del negocio (base64 o url)
   */
  protected getBusinessLogoSrc(): string {
    if (this.business && this.business.images && this.business.images.length > 0) {
      const img = this.business.images[0].imageBase64;
      if (!img) return '';
      if (img.startsWith('data:image')) return img;
      if (/^[A-Za-z0-9+/=]+$/.test(img) && img.length > 100) {
        return 'data:image/jpeg;base64,' + img;
      }
      return img;
    }
    // fallback: imagen por categoría
    const images: Record<string, string> = {
      'Peluquería': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=3274&auto=format&fit=crop',
      'Bienestar': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=3270&auto=format&fit=crop',
      'Salud': 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=3270&auto=format&fit=crop',
      'Electrónica': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=3301&auto=format&fit=crop',
      'default': 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=3271&auto=format&fit=crop'
    };
    return this.business ? (images[this.business.category] || images['default']) : images['default'];
  }

  /**
   * Genera un enlace de WhatsApp con el número y mensaje personalizado
   */
  protected getWhatsAppLink(phone: string, businessName: string): string {
    const cleanedPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola, quiero información sobre ${businessName}`);
    return `https://wa.me/${cleanedPhone}?text=${message}`;
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
        next: (business) => {
          this.business = business;
          this.services = business.services.filter(s => s.isActive);
          this.employees = business.employees.filter(e => e.isActive);
          this.filteredServices = this.services;
          this.filteredEmployees = this.employees;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  protected filterByService(event: any): void {
    this.selectedServiceFilter = event.detail.value;
    this.applyServiceFilter();
  }

  private applyServiceFilter(): void {
    if (!this.business) return;
    if (!this.selectedServiceFilter) {
      this.filteredServices = this.services;
    } else {
      this.filteredServices = this.services.filter(s => s.id === this.selectedServiceFilter);
    }
  }

  protected filterByEmployee(event: any): void {
    this.selectedEmployeeFilter = event.detail.value;
    this.applyEmployeeFilter();
  }

  private applyEmployeeFilter(): void {
    if (!this.business) return;
    if (!this.selectedEmployeeFilter) {
      this.filteredEmployees = this.employees;
    } else {
      this.filteredEmployees = this.employees.filter(e => e.id === this.selectedEmployeeFilter);
    }
  }

  /**
 * Devuelve el src correcto para una imagen base64 de empleado
 */
  getEmployeeImageSrc(photoBase64: string | undefined): string {
    if (!photoBase64) return '';
    if (photoBase64.startsWith('data:image')) return photoBase64;
    if (/^[A-Za-z0-9+/=]+$/.test(photoBase64) && photoBase64.length > 100) {
      return 'data:image/jpeg;base64,' + photoBase64;
    }
    return photoBase64;
  }
  /**
   * Devuelve las iniciales del empleado
   */
  getEmployeeInitials(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
}
