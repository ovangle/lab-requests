import {
  StoredFile,
  storedFileFromJson,
  storedFileToJson,
} from 'src/app/common/file/stored-file';

export interface WorkUnitFileAttachment extends StoredFile {
  readonly workUnitId: string;
}

export function workUnitFileAttachmentFromJson(json: {
  [k: string]: any;
}): WorkUnitFileAttachment {
  return {
    ...storedFileFromJson(json),
    workUnitId: json['workUnitId'],
  };
}

export function workUnitFileAttachmentToJson(obj: WorkUnitFileAttachment) {
  return {
    ...storedFileToJson(obj),
    workUnitId: obj.workUnitId,
  };
}
