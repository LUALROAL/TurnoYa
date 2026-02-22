import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthSessionService } from '../core/services/auth-session.service';

type QuickAccessItem = {
  title: string;
  subtitle: string;
  icon: string;
  route?: string;
};

type RecommendedBusiness = {
  name: string;
  category: string;
  distanceKm: number;
  priceLabel: string;
  rating: number;
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink],
})
export class HomePage implements OnInit, OnDestroy {
  protected readonly quickAccessItems: QuickAccessItem[] = [
    {
      title: 'Negocios',
      subtitle: 'Explorar servicios',
      icon: 'storefront-outline',
      route: '/businesses',
    },
    {
      title: 'Mis Negocios',
      subtitle: 'Gestionar mis locales',
      icon: 'business-outline',
      route: '/owner/businesses',
    },
    {
      title: 'Mis citas',
      subtitle: 'Ver agenda',
      icon: 'calendar-clear-outline',
      route: '/appointments',
    },
    {
      title: 'Perfil',
      subtitle: 'Editar cuenta',
      icon: 'person-circle-outline',
      route: '/profile',
    },
    {
      title: 'Administración',
      subtitle: 'Gestionar usuarios',
      icon: 'shield-checkmark-outline',
      route: '/admin/users',
    },
  ];

  protected loadingRecommendations = true;
  protected recommendedBusinesses: RecommendedBusiness[] = [];

  private readonly initialRecommendations: RecommendedBusiness[] = [
    {
      name: 'Luxe Barbershop',
      category: 'Peluquería',
      distanceKm: 1.2,
      priceLabel: '$30 / corte',
      rating: 4.9,
    },
    {
      name: 'Zen Yoga Studio',
      category: 'Bienestar',
      distanceKm: 1.9,
      priceLabel: '$25 / clase',
      rating: 4.8,
    },
    {
      name: 'Pure Dental',
      category: 'Salud',
      distanceKm: 4.0,
      priceLabel: '$120 / visita',
      rating: 5.0,
    },
    {
      name: 'Tech Repair',
      category: 'Electrónica',
      distanceKm: 2.3,
      priceLabel: '$45 / reparación',
      rating: 4.7,
    },
  ];

  private loadTimeoutId?: ReturnType<typeof setTimeout>;

  constructor(protected authSession: AuthSessionService) {}

  /**
   * Verifica si el usuario actual es Admin
   */
  isAdmin(): boolean {
    const session = this.authSession.getSession();
    return session?.user?.role === 'Admin';
  }

  ngOnInit() {
    // Simulamos carga de datos
    this.loadTimeoutId = setTimeout(() => {
      this.recommendedBusinesses = this.initialRecommendations;
      this.loadingRecommendations = false;
    }, 1500);
  }

  ngOnDestroy() {
    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
    }
  }

  protected trackByBusinessName(_: number, business: RecommendedBusiness) {
    return business.name;
  }

  // Método para obtener el nombre del usuario
  protected getUserName(): string {
    const session = this.authSession.getSession();
    return session?.user?.firstName || 'Usuario';
  }
}
