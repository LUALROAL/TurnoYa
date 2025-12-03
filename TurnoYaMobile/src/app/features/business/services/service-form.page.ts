import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonToggle,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { BusinessService } from '../../../core/services/business.service';

@Component({
  selector: 'app-service-form',
  templateUrl: './service-form.page.html',
  styleUrls: ['./service-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonToggle
  ]
})
export class ServiceFormPage implements OnInit {
  form!: FormGroup;
  businessId = '';
  serviceId: string | null = null;
  title = 'Nuevo Servicio';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('businessId') || '';
    this.serviceId = this.route.snapshot.paramMap.get('id');

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      duration: [30, [Validators.required, Validators.min(5)]],
      price: [0, [Validators.required, Validators.min(0)]],
      currency: ['COP', Validators.required],
      isActive: [true]
    });

    if (this.serviceId) {
      this.title = 'Editar Servicio';
      this.loadService();
    }
  }

  loadService() {
    // Reutilizamos getBusinessServices y filtramos por id
    this.businessService.getBusinessServices(this.businessId).subscribe({
      next: (list: any) => {
        const services = Array.isArray(list) ? list : ((list as any)?.data || []);
        const svc = services.find((s: any) => s.id === this.serviceId);
        if (svc) this.form.patchValue(svc);
      }
    });
  }

  async submit() {
    if (this.form.invalid) return;
    const loading = await this.loadingController.create({ message: this.serviceId ? 'Actualizando...' : 'Creando...' });
    await loading.present();

    const data = this.form.value;

    const obs = this.serviceId
      ? this.businessService.updateService(this.serviceId, data)
      : this.businessService.createService(this.businessId, data);

    obs.subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showToast('Guardado correctamente', 'success');
        this.router.navigate(['/business', this.businessId, 'services']);
      },
      error: async () => {
        await loading.dismiss();
        await this.showToast('Error al guardar', 'danger');
      }
    });
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
