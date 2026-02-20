import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { BusinessListItem } from "../models";

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
}
