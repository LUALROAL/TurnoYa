import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  storefrontOutline,
  businessOutline,
  calendarClearOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { Observable, Subscription } from 'rxjs';
import { AuthSession } from '../../../core/models/auth-session.model';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, RouterLinkActive]
})
export class BottomNavComponent implements OnInit, OnDestroy {
  session$: Observable<AuthSession | null>;
  private sessionSub?: Subscription;
  isAdmin = false;
  isOwner = false;

  constructor(private authSession: AuthSessionService) {
    this.session$ = this.authSession.session$;
    addIcons({
      'home-outline': homeOutline,
      'storefront-outline': storefrontOutline,
      'business-outline': businessOutline,
      'calendar-clear-outline': calendarClearOutline,
      'person-circle-outline': personCircleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
    });
  }

  ngOnInit() {
    this.sessionSub = this.session$.subscribe(session => {
      const role = session?.user?.role;
      this.isAdmin = role === 'Admin';
      this.isOwner = role === 'OwnerBusiness' || role === 'Owner';
    });
  }

  ngOnDestroy() {
    this.sessionSub?.unsubscribe();
  }
}
