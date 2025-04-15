import { inject, Injectable, signal } from '@angular/core';

import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { map, catchError, throwError, tap } from 'rxjs';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private errorService = inject(ErrorService);
  private httpClient = inject(HttpClient);
  private userPlaces = signal<Place[]>([]);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/places',
      'Something went wrong fetching available places.'
    );
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places',
      'Something went wrong fetching your favorite places.'
    ).pipe(tap({ next: (userPlaces) => this.userPlaces.set(userPlaces) }));
  }

  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces();

    if (!prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set([...prevPlaces, place]);
    }

    return this.httpClient
      .put('http://localhost:3000/user-places', {
        placeId: place.id,
      })
      .pipe(
        catchError((err) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to store selected place.');
          return throwError(() => new Error('Failed to store selected place.'));
        })
      );
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if (prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set(prevPlaces.filter((p) => p.id !== place.id));
    }

    return this.httpClient
      .delete('http://localhost:3000/user-places/' + place.id)
      .pipe(
        catchError((err) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to remove selected place.');
          return throwError(
            () => new Error('Failed to remove selected place.')
          );
        })
      );
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get<{ places: Place[] }>(url).pipe(
      map((resData) => resData.places),
      catchError((err) => {
        console.log(err);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
