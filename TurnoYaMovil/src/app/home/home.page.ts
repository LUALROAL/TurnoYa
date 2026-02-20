import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

type QuickAccessItem = {
  title: string;
  subtitle: string;
  icon: string;
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
  imports: [IonicModule, CommonModule],
})
export class HomePage implements OnInit, OnDestroy {
  protected readonly quickAccessItems: QuickAccessItem[] = [
    {
      title: 'Negocios',
      subtitle: 'Explorar servicios',
      icon: 'storefront-outline',
    },
    {
      title: 'Mis citas',
      subtitle: 'Ver agenda',
      icon: 'calendar-clear-outline',
    },
    {
      title: 'Perfil',
      subtitle: 'Editar cuenta',
      icon: 'person-circle-outline',
    },
  ];

  protected loadingRecommendations = true;
  protected recommendedBusinesses: RecommendedBusiness[] = [];

  private readonly initialRecommendations: RecommendedBusiness[] = [
    {
      name: 'Luxe Barbershop',
      category: 'Peluqueria',
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
      distanceKm: 4,
      priceLabel: '$120 / visita',
      rating: 5,
    },
  ];

  private loadTimeoutId?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadTimeoutId = setTimeout(() => {
      this.recommendedBusinesses = this.initialRecommendations;
      this.loadingRecommendations = false;
    }, 900);
  }

  ngOnDestroy() {
    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
    }
  }

  protected trackByBusinessName(_: number, business: RecommendedBusiness) {
    return business.name;
  }
}
