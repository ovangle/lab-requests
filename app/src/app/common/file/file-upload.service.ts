import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { StoredFile } from "./stored-file";


@Injectable()
export class FileUploadService<TFile extends StoredFile, TParams extends {[k: string]: any}> {
    upload(
        to: string,
        uploadFile: File,
        params?: TParams
    ): Observable<TFile> {
        const data = new FormData();
        if (data) {
            JSON.stringify(data);
            const jsonBlob = new Blob([
                JSON.stringify(data)
            ], {
                type: 'application/json'
            });
            data.append("document", jsonBlob)
        }

        data.append("file", uploadFile, uploadFile.name);

    }
}