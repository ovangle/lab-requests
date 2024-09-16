import { parseISO } from "date-fns";
import { firstValueFrom } from "rxjs";
import { ModelRef, isModelRef, modelRefFromJson } from "src/app/common/model/model";
import { ModelService } from "src/app/common/model/model-service";
import { User } from "src/app/user/user";
import { JsonObject } from "src/app/utils/is-json-object";

const _PROVISION_STATUSES: ReadonlyArray<string> = [
    'requested',
    'approved',
    'rejected',
    'denied',
    'purchased',
    'completed',
    'cancelled'
]

export type ProvisionStatus = typeof _PROVISION_STATUSES[number];

export const PROVISION_STATUSES = _PROVISION_STATUSES as ReadonlyArray<ProvisionStatus>;

export function isProvisionStatus(obj: unknown): obj is ProvisionStatus {
    return typeof obj === 'string' && _PROVISION_STATUSES.includes(obj);
}

export class ProvisionStatusMetadata<T extends ProvisionStatus> {
    readonly status: T;
    readonly at: Date;
    _by: ModelRef<User>;
    get by() { return this._by!; }
    readonly note: string;

    constructor(params: Partial<ProvisionStatusMetadata<T>>) {
        this.status = params.status!;
        this.at = params.at!;
        this._by = params.by!;
        this.note = params.note!;
    }

    async resolveBy(using: ModelService<User>): Promise<User> {
        if (typeof this._by === 'string') {
            this._by = await firstValueFrom(using.fetch(this._by));
        }
        return this._by;
    }
}

export function provisionStatusMetadataFromJsonObject<TStatus extends ProvisionStatus>(
    status: TStatus,
    json: JsonObject
): ProvisionStatusMetadata<TStatus> | undefined {
    const atKey = status + 'At';
    if (typeof json[atKey] == undefined) {
        return undefined;
    }

    if (typeof json[atKey] !== 'string') {
        throw new Error(`Expected a string '${atKey}'`)
    }
    const at = parseISO(json[atKey] as string);

    const byKey = status + 'By';
    const by = modelRefFromJson(byKey, User, json);

    const noteKey = status + 'Note';
    if (typeof json[noteKey] !== 'string') {
        throw new Error(`Expected a string '${noteKey}'`)
    }
    const note = json[noteKey] as string;
    return new ProvisionStatusMetadata({
        status, by, at, note
    });
}