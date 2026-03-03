import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { BusinessDetail, BusinessListItem } from "../models";

type BusinessSettingsResponse = {
  bookingAdvanceDays: number;
  cancellationHours: number;
  bufferTimeBetweenAppointments: number;
  workingHours?: string;
};

type BusinessSearchParams = {
  query?: string;
  city?: string;
  category?: string;
};

@Injectable({
  providedIn: "root",
})
export class BusinessService {
  constructor(private readonly api: ApiService) {}

  getAll(): Observable<BusinessListItem[]> {
    return this.api.get<BusinessListItem[]>("/api/business");
  }

  getCategories(): Observable<string[]> {
    return this.api.get<string[]>("/api/business/categories");
  }

  search(params: BusinessSearchParams): Observable<BusinessListItem[]> {
    return this.api.get<BusinessListItem[]>("/api/business/search", {
      params,
    });
  }

  getById(id: string): Observable<BusinessDetail> {
    return this.api.get<BusinessDetail>(`/api/business/${id}`);
  }

  getSettings(id: string): Observable<BusinessSettingsResponse> {
    return this.api.get<BusinessSettingsResponse>(`/api/business/${id}/settings`);
  }
}
