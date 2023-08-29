import { differenceInCalendarWeeks } from "date-fns";

export const ALL_SCHEDULE_DURATIONS = [
    'week',
    'fortnight'
] as const;

export type ScheduleDuration = typeof ALL_SCHEDULE_DURATIONS[number];

export class Schedule {
    startDate: Date | null;
    endDate: Date | null;

    estimatedHoursPerUnitDuration: number;
    duration: ScheduleDuration;

    get totalHours(): number {
        if (this.startDate == null || this.endDate == null) {
            return Infinity;
        }

        const calendarWeeks= differenceInCalendarWeeks(this.startDate, this.endDate);
        if (this.duration === 'fortnight') {
            return (calendarWeeks / 2) * this.estimatedHoursPerUnitDuration;
        }
        return calendarWeeks * this.estimatedHoursPerUnitDuration;
    }
}