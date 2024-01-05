import { Injectable, inject } from '@angular/core';
import * as uuid from 'uuid';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import urlJoin from 'url-join';
import { EquipmentService } from '../common/equipment';
import { API_BASE_URL } from 'src/app/common/model/model-service';

export interface EquipmentTag {
  readonly id: string;
  readonly name: string;
}

export function equipmentTag(params: Partial<EquipmentTag>) {
  return {
    id: params.id || uuid.v4(),
    name: params.name || '',
  };
}

@Injectable()
export class EquipmentTagService {
  readonly _apiBaseUrl = inject(API_BASE_URL);
  readonly httpClient = inject(HttpClient);
  readonly equipments = inject(EquipmentService);

  queryTags(search: string): Observable<EquipmentTag[]> {
    const url = urlJoin(this._apiBaseUrl, this.equipments.path, '/tags');

    return this.httpClient
      .get<{ items: EquipmentTag[] }>(url, {
        params: { name_like: search },
      })
      .pipe(map((page) => page.items));
  }
}
