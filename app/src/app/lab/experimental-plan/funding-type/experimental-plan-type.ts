

export interface ExperimentalPlanType {
    readonly description: string;
    readonly requiresSupervisor: boolean;
}

export const GRANT = {
    description: 'Grant',
    requiresSupervisor: true
};

export const GENERAL_RESEARCH_PLAN = {
    description: 'General research',
    requiresSupervisor: true
};

export const STUDENT_PROJECT = {
    description: 'Student project',
    requiresSupervisor: true
};

export const PLAN_TYPES: Array<ExperimentalPlanType> = [
    GRANT,
    GENERAL_RESEARCH_PLAN,
    STUDENT_PROJECT
];
