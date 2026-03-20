import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, notifications } from 'ionicons/icons';
import { NotifyService } from '../../../core/services/notify.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, IonIcon],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent implements OnInit {
  private readonly notifyService = inject(NotifyService);

  protected unreadCount$ = this.notifyService.unreadCount$;

  constructor() {
    addIcons({
      notificationsOutline,
      notifications,
    });
  }

  ngOnInit(): void {}

  async openNotificationCenter(): Promise<void> {
    await this.notifyService.openNotificationCenter();
  }
}
