import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { environment } from "../../../environments/environment";

export type ApiQueryParams = Record<string, string | number | boolean | null | undefined>;

export interface ApiRequestOptions {
  params?: ApiQueryParams;
  headers?: HttpHeaders;
}

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, "");

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: ApiRequestOptions) {
    return this.http.get<T>(this.buildUrl(path), this.toHttpOptions(options));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions) {
    return this.http.post<T>(this.buildUrl(path), body, this.toHttpOptions(options));
  }

  put<T>(path: string, body: unknown, options?: ApiRequestOptions) {
    return this.http.put<T>(this.buildUrl(path), body, this.toHttpOptions(options));
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions) {
    return this.http.patch<T>(this.buildUrl(path), body, this.toHttpOptions(options));
  }

  delete<T>(path: string, options?: ApiRequestOptions) {
    return this.http.delete<T>(this.buildUrl(path), this.toHttpOptions(options));
  }

  private buildUrl(path: string) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  private toHttpOptions(options?: ApiRequestOptions) {
    if (!options) {
      return {};
    }

    const params = this.buildParams(options.params);

    return {
      headers: options.headers,
      params,
    };
  }

  private buildParams(params?: ApiQueryParams) {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
