import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import {
  callOutline,
  lockClosedOutline,
  mailOutline,
  personAddOutline,
  personCircleOutline,
  personOutline,
  arrowForwardOutline,
  arrowForward,
  calendarOutline,
  calendarNumberOutline,
  timeOutline,
  locationOutline,
  businessOutline,
  alertCircleOutline,
  chevronDownCircleOutline,
  chevronDown,
  chevronDownOutline,
  mapOutline,
  star,
  pricetag,
  storefrontOutline,
  add,
  notificationsOutline,
  searchOutline,
  hourglassOutline,
  checkmarkCircleOutline,
  ribbonOutline,
  closeCircleOutline,
  helpCircleOutline,
  create,
  trash,
  close,
  checkmarkCircle,
  checkmarkDoneCircle
} from 'ionicons/icons';
import { addIcons } from 'ionicons';


addIcons({
  'mail-outline': mailOutline,
  'lock-closed-outline': lockClosedOutline,
  'person-outline': personOutline,
  'person-circle-outline': personCircleOutline,
  'call-outline': callOutline,
  'person-add-outline': personAddOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'arrow-forward': arrowForward,
  'calendar-outline': calendarOutline,
  'calendar-number-outline': calendarNumberOutline,
  'time-outline': timeOutline,
  'location-outline': locationOutline,
  'business-outline': businessOutline,
  'alert-circle-outline': alertCircleOutline,
  'chevron-down-circle-outline': chevronDownCircleOutline,
  'chevron-down-outline': chevronDownOutline,
  'chevron-down': chevronDown,
  'map-outline': mapOutline,
  'star': star,
  'pricetag': pricetag,
  'storefront-outline': storefrontOutline,
  'add': add,
  'notifications-outline': notificationsOutline,
  'search-outline': searchOutline,
  'hourglass-outline': hourglassOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'ribbon-outline': ribbonOutline,
  'close-circle-outline': closeCircleOutline,
  'help-circle-outline': helpCircleOutline,
  'create': create,
  'trash': trash,
  'close': close,
  'checkmark-circle': checkmarkCircle,
  'checkmark-done-circle': checkmarkDoneCircle
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    importProvidersFrom(IonicStorageModule.forRoot()),
  ],
});
