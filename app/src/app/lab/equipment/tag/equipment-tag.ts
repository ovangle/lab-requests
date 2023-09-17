
import { Injectable, inject } from '@angular/core';
import * as uuid from 'uuid';
import { EquipmentModelService } from '../equipment';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import urlJoin from 'url-join';

export interface EquipmentTag {
    readonly id: string;
    readonly name: string;
}

export function equipmentTag(params: Partial<EquipmentTag>) {
    return {
        id: params.id || uuid.v4(),
        name: params.name || ''
    };
}

@Injectable()
export class EquipmentTagService {
    readonly httpClient = inject(HttpClient);
    readonly equipments = inject(EquipmentModelService);

    queryTags(search: string): Observable<EquipmentTag[]> {
        const url = urlJoin(
            this.equipments.apiBaseUrl,
            this.equipments.resourcePath,
            '/tags'
        );

        return this.httpClient.get<{items: EquipmentTag[]}>(url, { 
            params: { name_like: search }
        }).pipe(
            map(page => page.items)
        );
    }
}