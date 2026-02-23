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

  autocomplete(query: string): Observable<CityAutocompleteResult[]> {
    return this.api.get<CityAutocompleteResult[]>("/api/cities/autocomplete", {
      params: { query }
    });
  }
}
