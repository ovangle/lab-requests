

export interface ExperimentalPlanType {
    readonly description: string;
}

export const GRANT = {
    description: 'Grant'
};

export const GENERAL_RESEARCH_PLAN = {
    description: 'General research'
};

export const STUDENT_PROJECT = {
    description: 'Student project'
};

export const PLAN_TYPES = [
    GRANT,
    GENERAL_RESEARCH_PLAN,
    STUDENT_PROJECT
];
