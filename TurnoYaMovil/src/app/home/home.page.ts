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
  services: string;
  distanceKm: number;
  priceLabel: string;
  rating: number;
  reviewCount: string;
  nextAvailable: string;
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
      name: 'Elite Spa & Wellness',
      category: 'Bienestar',
      services: 'Masaje • Facial • Sauna',
      distanceKm: 1.2,
      priceLabel: '$120 / visita',
      rating: 4.9,
      reviewCount: '2k',
      nextAvailable: 'Hoy, 16:00',
    },
    {
      name: 'Luxe Barbershop',
      category: 'Peluquería',
      services: 'Corte • Barba • Arreglo',
      distanceKm: 0.8,
      priceLabel: '$30 / corte',
      rating: 4.8,
      reviewCount: '1.5k',
      nextAvailable: 'Hoy, 18:30',
    },
    {
      name: 'Zen Yoga Studio',
      category: 'Bienestar',
      services: 'Yoga • Meditación • Pilates',
      distanceKm: 1.9,
      priceLabel: '$25 / clase',
      rating: 4.8,
      reviewCount: '856',
      nextAvailable: 'Mañana, 10:00',
    },
    {
      name: 'Pure Dental',
      category: 'Salud',
      services: 'Limpieza • Blanqueamiento',
      distanceKm: 4.0,
      priceLabel: '$120 / visita',
      rating: 5.0,
      reviewCount: '3.2k',
      nextAvailable: 'Mañana, 9:30',
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

  // Método para obtener imágenes según categoría
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
