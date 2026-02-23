// ...existing code...
import { Injectable } from "@angular/core";
import { ApiService } from "../../../core/services/api.service";
import { Observable } from "rxjs";

export interface CityAutocompleteResult {
  name: string;
  state: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: "root" })
export class CityService {
  constructor(private readonly api: ApiService) {}
  searchDepartments(query: string): Observable<string[]> {
    return this.api.get<string[]>("/api/cities/search-departments", { params: { query } });
  }

  searchCities(query: string, department?: string): Observable<string[]> {
    const params: any = { query };
    if (department) params.department = department;
    return this.api.get<string[]>("/api/cities/search-cities", { params });
  }

  autocomplete(query: string, department?: string): Observable<CityAutocompleteResult[]> {
    const params: any = { query };
    if (department) params.department = department;
    return this.api.get<CityAutocompleteResult[]>("/api/cities/autocomplete", { params });
  }

  /**
   * Obtiene todas las ciudades/pueblos de un departamento (catálogo local)
   */
  getCitiesByDepartment(department: string): Observable<string[]> {
    return this.api.get<string[]>("/api/cities/by-department", { params: { department } });
  }
}
