import { Injectable } from "@angular/core";
import { ToastController } from "@ionic/angular";

@Injectable({
  providedIn: "root",
})
export class NotifyService {
  constructor(private readonly toastController: ToastController) {}

  async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: "top",
      color: "danger",
    });

    await toast.present();
  }

  async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: "top",
      color: "success",
    });

    await toast.present();
  }
}
