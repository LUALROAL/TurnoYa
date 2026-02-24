import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface AppPhoto {
  filepath: string;
  webPath?: string;
  base64String?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor() { }

  /**
   * Tomar una foto con la cámara
   */
  async takePhoto(): Promise<AppPhoto> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false,
        width: 1200,
        height: 1200
      });

      const photo: AppPhoto = {
        filepath: image.path || 'photo.jpg',
        webPath: image.webPath
      };

      // Si estamos en web, obtener base64
      if (Capacitor.getPlatform() === 'web' && image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const base64 = await this.blobToBase64(blob);
        photo.base64String = base64;
      }

      return photo;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  /**
   * Seleccionar imágenes de la galería
   */
  async selectImages(): Promise<AppPhoto[]> {
    try {
      const photos = await Camera.pickImages({
        quality: 90,
        limit: 5
      });

      const selectedPhotos: AppPhoto[] = [];

      for (const photo of photos.photos) {
        const imageData: AppPhoto = {
          filepath: photo.path || 'photo.jpg',
          webPath: photo.webPath
        };

        // Si estamos en web, obtener base64
        if (Capacitor.getPlatform() === 'web' && photo.webPath) {
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          imageData.base64String = base64;
        }

        selectedPhotos.push(imageData);
      }

      return selectedPhotos;
    } catch (error) {
      console.error('Error selecting images:', error);
      throw error;
    }
  }

  /**
   * Convertir Blob a Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
