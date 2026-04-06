
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  storefrontOutline,
  businessOutline,
  calendarClearOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  locationOutline,
  sparklesOutline,
  checkmarkCircle,
  star,
  checkmarkCircleOutline,
  peopleOutline
} from 'ionicons/icons';
import { AuthSessionService } from '../core/services/auth-session.service';
import { Observable, Subscription } from 'rxjs';
import { AuthSession } from '../core/models/auth-session.model';
import { UserService } from '../features/account/services/user.service';
import { UserProfileDto } from '../features/account/models/user-profile.model';

type QuickAccessItem = {
  title: string;
  subtitle: string;
  icon: string;
  route?: string;
  queryParams?: Record<string, string>;
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
    // {
    //   title: 'Trabajo',
    //   subtitle: 'Donde trabajo',
    //   icon: 'people-outline',
    //   route: '/businesses',
    //   queryParams: { role: 'employee' },
    // },
    // {
    //   title: 'Asociarme',
    //   subtitle: 'Unirse a un negocio',
    //   icon: 'link-outline',
    //   route: '/owner/businesses',
    //   queryParams: { action: 'join' },
    // },
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

  private sessionSub?: Subscription;
  session$: Observable<AuthSession | null>;
  userName: string = 'Usuario';
  userRole: string = '';
  userPhotoUrl: string | null = null;
  
  constructor(
    protected authSession: AuthSessionService,
    private userService: UserService
  ) {
    this.session$ = this.authSession.session$;

    // Register icons used in the template
    addIcons({
      'search-outline': searchOutline,
      'storefront-outline': storefrontOutline,
      'business-outline': businessOutline,
      'calendar-clear-outline': calendarClearOutline,
      'person-circle-outline': personCircleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'location-outline': locationOutline,
      'sparkles-outline': sparklesOutline,
      'checkmark-circle': checkmarkCircle,
      'star': star,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'people-outline': peopleOutline,
    });
  }

  /**
   * Verifica si el usuario actual es Admin
   */
  isAdmin(): boolean {
    const session = this.authSession.getSession();
    return session?.user?.role === 'Admin';
  }

  ngOnInit() {
    // Simulación de carga de recomendaciones (igual que antes)
    this.loadTimeoutId = setTimeout(() => {
      this.recommendedBusinesses = this.initialRecommendations;
      this.loadingRecommendations = false;
    }, 1500);

    // Suscripción al observable de sesión para actualizar propiedades locales
    this.sessionSub = this.session$.subscribe(session => {
      if (session?.user) {
        this.userName = session.user.firstName || 'Usuario';
        this.userRole = session.user.role || '';
      } else {
        this.userName = 'Usuario';
        this.userRole = '';
      }
    });

    // Cargar datos del perfil para la foto
    this.loadUserProfile();
  }

  /**
   * Carga el perfil del usuario para obtener la foto
   */
  private loadUserProfile(): void {
    if (!this.authSession.hasValidSession()) {
      return;
    }

    this.userService.getProfile().subscribe({
      next: (profile) => {
        // Prioridad: photoBase64 > googlePhotoUrl > photoUrl
        if (profile.photoBase64) {
          this.userPhotoUrl = 'data:image/jpeg;base64,' + profile.photoBase64;
        } else if (profile.googlePhotoUrl) {
          this.userPhotoUrl = profile.googlePhotoUrl;
        } else if (profile.photoUrl) {
          this.userPhotoUrl = profile.photoUrl;
        } else {
          this.userPhotoUrl = null;
        }
      },
      error: (err) => {
        console.error('Error loading profile in home:', err);
        this.userPhotoUrl = null;
      }
    });
  }

  ngOnDestroy() {
    if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
    this.sessionSub?.unsubscribe(); // evitar memory leaks
  }
  // ngOnDestroy() {
  //   if (this.loadTimeoutId) {
  //     clearTimeout(this.loadTimeoutId);
  //   }
  //   window.removeEventListener('refreshUserProfile', this.handleRefreshUserProfile);
  // }

  // Manejar refresco de perfil para actualizar el rol
  private handleRefreshUserProfile = () => {
    // Actualizar el rol del usuario en la sesión
    const session = this.authSession.getSession();
    if (session && session.user) {
      // Forzar actualización de la vista si usas signals/observables
      // Si solo usas getUserRole(), la vista se actualizará al llamar ese método
      // Si usas variables locales, actualízalas aquí
    }
  }

  protected trackByBusinessName(_: number, business: RecommendedBusiness) {
    return business.name;
  }

  // // Método para obtener el nombre del usuario
  // protected getUserName(): string {
  //   const session = this.authSession.getSession();
  //   return session?.user?.firstName || 'Usuario';
  // }

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

  /**
   * Devuelve el rol actual del usuario
   */

  // Métodos auxiliares (pueden usar las propiedades locales)
  protected getUserName(): string {
    return this.userName;
  }

  /**
   * Obtiene las iniciales del usuario para mostrar cuando no hay foto
   */
  protected getUserInitials(): string {
    const name = this.userName || 'Usuario';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  getUserRole(): string {
    return this.userRole;
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'Admin': return 'Administrador';
      case 'OwnerBusiness':
      case 'Owner': return 'Dueño';
      case 'Customer': return 'Cliente';
      default: return role || '';
    }
  }
}
