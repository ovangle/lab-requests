import {
  StoredFile,
  storedFileFromJson,
  storedFileToJson,
} from 'src/app/common/file/stored-file';
import type { Resource } from '../resource';
import { ResourceType } from '../resource-type';

export interface ResourceFileAttachment<T extends Resource = any>
  extends StoredFile {
  readonly resourceType: ResourceType & T['type'];
  readonly containerId: string;
  readonly resourceId: string;
}

export function resourceFileAttachmentFromJson(
  json: unknown,
): ResourceFileAttachment<any> {
  if (typeof json != 'object' || json == null) {
    throw new Error('Expected an object');
  }
  const jsonObj: { [k: string]: any } = json;
  const storedFile = storedFileFromJson(json);
  return {
    containerId: jsonObj['containerId'],
    resourceType: jsonObj['resourceType'],
    resourceId: jsonObj['resourceId'],
    ...storedFile,
  };
}

export function resourceFileAttachmentToJson(
  attachment: ResourceFileAttachment<any>,
): { [k: string]: any } {
  return {
    ...storedFileToJson(attachment),
    containerId: attachment.containerId,
    resourceType: attachment.resourceType,
    resourceI: attachment.resourceId,
  };
}
