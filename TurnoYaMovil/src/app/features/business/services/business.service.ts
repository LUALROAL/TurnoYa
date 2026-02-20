import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { BusinessListItem } from "../models";

@Injectable({
  providedIn: "root",
})
export class BusinessService {
  constructor(private readonly api: ApiService) {}

  getAll(): Observable<BusinessListItem[]> {
    return this.api.get<BusinessListItem[]>("/api/business");
  }
}
