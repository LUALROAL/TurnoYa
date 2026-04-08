import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from "@angular/core";
import { AuthService } from "../../features/auth/services/auth.service";

/**
 * Directiva estructural que muestra u oculta elementos según los permisos del empleado.
 * 
 * Uso en templates:
 * ```html
 * <ion-item *appHasPermission="'CanViewAppointments'" button detail>
 *   <ion-icon slot="start" name="calendar"></ion-icon>
 *   <ion-label>Citas</ion-label>
 * </ion-item>
 * ```
 */
@Directive({
  selector: "[appHasPermission]",
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private currentPermission: string | null = null;
  private hasView = false;

  @Input()
  set appHasPermission(permission: string) {
    this.currentPermission = permission;
    this.updateView();
  }

  constructor() {
    // Reaccionar a cambios en los permisos del servicio
    effect(() => {
      // Acceder al signal para crear una dependencia
      const _ = this.authService.permissions();
      // Actualizar la vista cuando cambian los permisos
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.currentPermission) {
      this.clearView();
      return;
    }

    const hasPermission = this.authService.hasPermission(this.currentPermission);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.clearView();
    }
  }

  private clearView(): void {
    this.viewContainer.clear();
    this.hasView = false;
  }
}