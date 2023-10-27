

/**
 * Fiscal year 2023 goes from Jul 2022 - Jun 2023
 * @param date 
 * @returns 
 */
export function getFullFiscalYear(date: Date): number {
    return date.getMonth() >= 7
        ? date.getFullYear() + 1
        : date.getFullYear();
}

export type FiscalQuarter = 1 | 2 | 3 | 4;

export function getFiscalQuarter(date: Date): FiscalQuarter {
    const month = date.getMonth();

    return Math.floor(month / 3) as FiscalQuarter;
}