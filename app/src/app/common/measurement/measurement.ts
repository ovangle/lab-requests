// import * as pluralize from "pluralize";

import { formatPlural } from '../plural.pipe';

export type UnitOfMeasurement = 'item' | string;

export function isUnitOfMeasurement(obj: unknown): obj is UnitOfMeasurement {
  return typeof obj === 'string';
}

export function isSIUnit(unit: UnitOfMeasurement): boolean {
  return /^(m|kg|.*\^)/.test(unit);
}
/**
 *
 * @param unitOfMeasurement
 * The unit of measurement to format
 * @param pluralQuantity
 * Accepts the following formats
 */
export function formatUnitOfMeasurement(
  unitOfMeasurement: UnitOfMeasurement,
  pluralQuantity: number,
  locale: string,
) {
  if (typeof pluralQuantity === 'number') {
    if (!isSIUnit(unitOfMeasurement)) {
      unitOfMeasurement = formatPlural(
        unitOfMeasurement,
        pluralQuantity,
        locale,
      );
    }
  }
  return unitOfMeasurement.replaceAll(/\^(\d+)/g, '<sup>$1</sup>');
}
