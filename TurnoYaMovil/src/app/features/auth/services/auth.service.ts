import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  login(_email: string, _password: string): Observable<void> {
    return of(void 0);
  }

  register(_fullName: string, _email: string, _password: string): Observable<void> {
    return of(void 0);
  }
}
