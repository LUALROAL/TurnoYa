import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PushNotificationService } from './core/services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule],
})
export class AppComponent implements OnInit {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  async ngOnInit(): Promise<void> {
    // Inicializar notificaciones push al arrancar la app
    // Esto solicita permisos y registra el dispositivo con FCM
    await this.pushNotificationService.init();
  }
}
