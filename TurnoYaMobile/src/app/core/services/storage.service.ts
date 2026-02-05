import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private ready: Promise<void>;

  constructor(private storage: Storage) {
    this.ready = this.init();
  }

  async init(): Promise<void> {
    // Crear instancia de storage
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Guardar dato
  public async set(key: string, value: any): Promise<void> {
    await this.ready;
    await this._storage?.set(key, value);
  }

  // Obtener dato
  public async get(key: string): Promise<any> {
    await this.ready;
    return await this._storage?.get(key);
  }

  // Eliminar dato
  public async remove(key: string): Promise<void> {
    await this.ready;
    await this._storage?.remove(key);
  }

  // Limpiar todo el storage
  public async clear(): Promise<void> {
    await this.ready;
    await this._storage?.clear();
  }

  // Obtener todas las claves
  public async keys(): Promise<string[]> {
    await this.ready;
    return await this._storage?.keys() || [];
  }

  // Verificar si existe una clave
  public async has(key: string): Promise<boolean> {
    const keys = await this.keys();
    return keys.includes(key);
  }
}
