import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import { HttpClient } from "@angular/common/http";

import {StoredFile, storedFileFromJson} from './stored-file'
import urlJoin from "url-join";
import { API_BASE_URL } from "../model/model-service";

@Injectable()
export class FileUploadService {
    readonly httpClient = inject(HttpClient);
    readonly apiBaseUrl = inject(API_BASE_URL);

    sendFile(path: string, file: File, params?: {[k: string]: any}): Observable<StoredFile> {
        const data = new FormData();
        if (data) {
            JSON.stringify(data);
            const jsonBlob = new Blob([
                JSON.stringify(data)
            ], {
                type: 'application/json'
            });
            data.append("params", jsonBlob)
        }

        data.append("file", file, file.name);

        const url = urlJoin(this.apiBaseUrl, path);
        return this.httpClient.post(url, data).pipe(map(storedFileFromJson));
    }
}