
const _PROVISION_STATUSES: ReadonlyArray<string> = [
    'requested',
    'approved',
    'purchased',
    'installed',
    'cancelled'
]

export type ProvisionStatus = typeof _PROVISION_STATUSES[ number ];

export const PROVISION_STATUSES = _PROVISION_STATUSES as ReadonlyArray<ProvisionStatus>;

export function isProvisionStatus(obj: unknown): obj is ProvisionStatus {
    return typeof obj === 'string' && _PROVISION_STATUSES.includes(obj);
}



