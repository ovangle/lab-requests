import { inject } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { formatISO, parseISO } from "date-fns";
import { Model, ModelCreateRequest, ModelIndexPage } from "src/app/common/model/model";
import { isJsonObject, JsonObject } from "src/app/utils/is-json-object";
import { isUUID } from "src/app/utils/is-uuid";

export interface Allocatable<TAllocation extends LabAllocation<any>> {
    allocationType: string;
    activeAllocations: ModelIndexPage<TAllocation>;
}

export const ALLOCATION_STATUSES = [
    'requested',
    'approved',
    'rejected',
    'denied',
    'setup',
    'prepared',
    'in_progress',
    'completed',
    'cancelled',
    'teardown',
    'finalised'
] as const;
export type AllocationStatus = typeof ALLOCATION_STATUSES[number];
export function isAllocationStatus(obj: unknown): obj is AllocationStatus {
    return typeof obj === 'string' && ALLOCATION_STATUSES.includes(obj as any);
}

export interface AllocationEvent {
    status: AllocationStatus;
    at: Date;
    byId: string;
}

function allocationEventFromJson(json: JsonObject): AllocationEvent {
    if (!isAllocationStatus(json['status'])) {
        throw new Error("Expected an allocation status 'status'");
    }
    if (typeof json['at'] !== 'string') {
        throw new Error("Expected a datetime string 'at'");
    }
    if (!isUUID(json['byId'])) {
        throw new Error("Expected a UUID 'byId'");
    }
    return {
        status: json['status'],
        at: parseISO(json['at']),
        byId: json['byId']
    };
}

export class LabAllocation<TAllocatable extends Allocatable<any>> extends Model {
    readonly type: string;
    readonly labId: string;
    readonly status: AllocationStatus

    readonly consumerType: string;
    readonly consumerId: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;

    readonly requestAt: Date;
    readonly requestById: string;

    readonly allRequests: ReadonlyArray<AllocationEvent>;

    readonly isApproved: boolean;
    readonly approvedAt: Date | null;
    readonly approvedById: string | null;

    readonly isRejected: boolean;
    readonly rejectedAt: Date | null;
    readonly rejectedById: string | null;

    readonly allRejections: ReadonlyArray<AllocationEvent>;

    readonly isDenied: boolean;
    readonly deniedAt: Date | null;
    readonly deniedById: string | null;

    readonly setupBeginAt: Date | null;
    readonly setupById: string | null;

    readonly isPrepared: boolean;
    readonly preparedAt: Date | null;

    readonly isCommenced: boolean;
    readonly commencedAt: Date | null;
    readonly commencedById: string | null;

    readonly progressEvents: ReadonlyArray<AllocationEvent>;

    readonly isCompleted: boolean;
    readonly completedAt: Date | null;
    readonly completedById: string | null;

    readonly isCancelled: boolean;
    readonly cancelledAt: Date | null;
    readonly cancelledById: string | null;

    readonly teardownBeginAt: Date | null;
    readonly teardownById: string | null;

    readonly isFinalised: boolean;
    readonly finalisedAt: Date | null;
    readonly finalisedById: string | null;


    constructor(json: JsonObject) {
        super(json);

        if (typeof json['type'] !== 'string') {
            throw new Error("Expected a string 'type'");
        }
        this.type = json['type'];

        if (!isUUID(json['labId'])) {
            throw new Error("Expected a UUID 'labId'");
        }
        this.labId = json['labId'];

        if (typeof json['consumerType'] !== 'string') {
            throw new Error(`Expected a string 'consumerType'`);
        }
        this.consumerType = json['consumerType'];

        if (!isUUID(json['consumerId'])) {
            throw new Error("Expected a uuid 'consumerId'");
        }
        this.consumerId = json['consumerId'];

        if (!isAllocationStatus(json['status'])) {
            throw new Error("Expected an allocation status 'status'");
        }
        this.status = json['status'];

        if (typeof json['startDate'] == null) {
            this.startDate = null;
        } else if (typeof json['startDate'] === 'string') {
            this.startDate = parseISO(json['startDate']);
        } else {
            throw new Error(`Expected a datetime string or null 'startDate'`);
        }

        if (typeof json['endDate'] == null) {
            this.endDate = null;
        } else if (typeof json['endDate'] === 'string') {
            this.endDate = parseISO(json['endDate']);
        } else {
            throw new Error(`Expected a datetime string or null 'endDate'`);
        }


        if (typeof json['requestAt'] !== 'string') {
            throw new Error("Expected a datetime string 'requestAt'");
        }
        this.requestAt = parseISO(json['requestAt']);

        if (!isUUID(json['requestById'])) {
            throw new Error("Expected a UUID 'requestById'");
        }
        this.requestById = json['requestById'];

        if (!Array.isArray(json['allRequests']) || !json['allRequests'].every(isJsonObject)) {
            throw new Error("Expected an array of json objects 'allRequests'");
        }
        this.allRequests = json['allRequests'].map(allocationEventFromJson);

        if (typeof json['isApproved'] !== 'boolean') {
            throw new Error("Expected a boolean 'isApproved'");
        }
        this.isApproved = json['isApproved'];

        if (json['approvedAt'] == null) {
            this.approvedAt = null;
        } else if (typeof json['approvedAt'] === 'string') {
            this.approvedAt = parseISO(json['approvedAt']);
        } else {
            throw new Error("Expected a datetime string 'approvedAt'")
        }

        if (json['approvedById'] == null) {
            this.approvedById = null;
        } else if (isUUID(json['approvedById'])) {
            this.approvedById = json['approvedById']
        } else {
            throw new Error("Expected a datetime string 'approvedAt'")
        }

        if (typeof json['isRejected'] !== 'boolean') {
            throw new Error("Expected a boolean 'isRejected'");
        }
        this.isRejected = json['isRejected'];

        if (json['rejectedAt'] == null) {
            this.rejectedAt = null;
        } else if (typeof json['rejectedAt'] === 'string') {
            this.rejectedAt = parseISO(json['rejectedAt']);
        } else {
            throw new Error("Expected a datetime string 'rejectedAt'")
        }

        if (json['rejectedById'] == null) {
            this.rejectedById = null;
        } else if (isUUID(json['rejectedById'])) {
            this.rejectedById = json['rejectedById']
        } else {
            throw new Error("Expected a datetime string 'rejectedAt'")
        }

        if (!Array.isArray(json['allRejections']) || !json['allRejections'].every(isJsonObject)) {
            throw new Error("Expected a list of json objects 'allRejections'");
        }
        this.allRejections = json['allRejections'].map(allocationEventFromJson);

        if (typeof json['isDenied'] !== 'boolean') {
            throw new Error("Expected a boolean 'isDenied'");
        }
        this.isDenied = json['isDenied'];

        if (json['deniedAt'] == null) {
            this.deniedAt = null;
        } else if (typeof json['deniedAt'] === 'string') {
            this.deniedAt = parseISO(json['deniedAt']);
        } else {
            throw new Error("Expected a datetime string 'deniedAt'")
        }

        if (json['deniedById'] == null) {
            this.deniedById = null;
        } else if (isUUID(json['deniedById'])) {
            this.deniedById = json['deniedById']
        } else {
            throw new Error("Expected a datetime string 'deniedAt'")
        }

        if (json['setupBeginAt'] == null) {
            this.setupBeginAt = null;
        } else if (typeof json['setupBeginAt'] === 'string') {
            this.setupBeginAt = parseISO(json['setupBeginAt']);
        } else {
            throw new Error("Expected a datetime string 'setupBeginAt'")
        }

        if (json['setupById'] == null) {
            this.setupById = null;
        } else if (isUUID(json['setupById'])) {
            this.setupById = json['setupById']
        } else {
            throw new Error("Expected a datetime string 'setupAt'")
        }

        if (typeof json['isPrepared'] !== 'boolean') {
            throw new Error("Expected a boolean 'isPrepared'");
        }
        this.isPrepared = json['isPrepared'];


        if (json['preparedAt'] == null) {
            this.preparedAt = null;
        } else if (typeof json['preparedAt'] === 'string') {
            this.preparedAt = parseISO(json['preparedAt']);
        } else {
            throw new Error("Expected a datetime string 'preparedAt'")
        }

        if (typeof json['isCommenced'] !== 'boolean') {
            throw new Error("Expected a boolean 'isCommenced'");
        }
        this.isCommenced = json['isCommenced'];


        if (json['commencedAt'] == null) {
            this.commencedAt = null;
        } else if (typeof json['commencedAt'] === 'string') {
            this.commencedAt = parseISO(json['commencedAt']);
        } else {
            throw new Error("Expected a datetime string 'commencedAt'")
        }

        if (json['commencedById'] == null) {
            this.commencedById = null;
        } else if (isUUID(json['commencedById'])) {
            this.commencedById = json['commencedById']
        } else {
            throw new Error("Expected a datetime string 'commencedAt'")
        }

        if (!Array.isArray(json['progressEvents']) || !json['progressEvents'].every(isJsonObject)) {
            throw new Error("Expected a list of json objects 'progressEvents'");
        }
        this.progressEvents = json['progressEvents'].map(allocationEventFromJson)

        if (typeof json['isCompleted'] !== 'boolean') {
            throw new Error("Expected a boolean 'isCompleted'");
        }
        this.isCompleted = json['isCompleted'];

        if (json['completedAt'] == null) {
            this.completedAt = null;
        } else if (typeof json['completedAt'] === 'string') {
            this.completedAt = parseISO(json['completedAt']);
        } else {
            throw new Error("Expected a datetime string 'completedAt'")
        }

        if (json['completedById'] == null) {
            this.completedById = null;
        } else if (isUUID(json['completedById'])) {
            this.completedById = json['completedById']
        } else {
            throw new Error("Expected a datetime string 'completedAt'")
        }

        if (typeof json['isCancelled'] !== 'boolean') {
            throw new Error("Expected a boolean 'isCancelled'");
        }
        this.isCancelled = json['isCancelled'];


        if (json['cancelledAt'] == null) {
            this.cancelledAt = null;
        } else if (typeof json['cancelledAt'] === 'string') {
            this.cancelledAt = parseISO(json['cancelledAt']);
        } else {
            throw new Error("Expected a datetime string 'cancelledAt'")
        }

        if (json['cancelledById'] == null) {
            this.cancelledById = null;
        } else if (isUUID(json['cancelledById'])) {
            this.cancelledById = json['cancelledById']
        } else {
            throw new Error("Expected a datetime string 'cancelledAt'")
        }

        if (json['teardownBeginAt'] == null) {
            this.teardownBeginAt = null;
        } else if (typeof json['teardownBeginAt'] === 'string') {
            this.teardownBeginAt = parseISO(json['teardownBeginAt']);
        } else {
            throw new Error("Expected a datetime string 'teardownBeginAt'")
        }

        if (json['teardownById'] == null) {
            this.teardownById = null;
        } else if (isUUID(json['teardownById'])) {
            this.teardownById = json['teardownById']
        } else {
            throw new Error("Expected a datetime string 'teardownAt'")
        }

        if (typeof json['isFinalised'] !== 'boolean') {
            throw new Error("Expected a boolean 'isFinalised'");
        }
        this.isFinalised = json['isFinalised'];

        if (json['finalisedAt'] == null) {
            this.finalisedAt = null;
        } else if (typeof json['finalisedAt'] === 'string') {
            this.finalisedAt = parseISO(json['finalisedAt']);
        } else {
            throw new Error("Expected a datetime string 'finalisedAt'")
        }

        if (json['finalisedById'] == null) {
            this.finalisedById = null;
        } else if (isUUID(json['finalisedById'])) {
            this.finalisedById = json['finalisedById']
        } else {
            throw new Error("Expected a datetime string 'finalisedAt'")
        }
    }
}

export function labAllocationCreateForm() {
    const fb = inject(FormBuilder);
    return fb.group({
        startDate: fb.control<Date | null>(null),
        endDate: fb.control<Date | null>(null)
    });
}

export interface LabAllocationCreateRequest<TAllocation extends LabAllocation<any>> extends ModelCreateRequest<TAllocation> {
    consumerType: string;
    consumer: string;
    startDate: Date | null;
    endDate: Date | null;
}

export function labAllocationCreateRequestToJsonObject(request: LabAllocationCreateRequest<any>) {
    return {
        consumer: request.consumer,
        startDate: request.startDate ? formatISO(request.startDate) : null,
        endDate: request.endDate ? formatISO(request.endDate) : null,
    };
}
