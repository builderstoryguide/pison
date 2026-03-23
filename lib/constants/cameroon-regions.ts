/**
 * The 10 official regions of Cameroon (as of 2008 decree).
 * Used for dropdowns and validation across the application.
 */
export const CAMEROON_REGIONS = [
  { value: 'Adamawa', i18nKey: 'adamawa' },
  { value: 'Centre', i18nKey: 'centre' },
  { value: 'East', i18nKey: 'east' },
  { value: 'Far North', i18nKey: 'farNorth' },
  { value: 'Littoral', i18nKey: 'littoral' },
  { value: 'North', i18nKey: 'north' },
  { value: 'Northwest', i18nKey: 'northwest' },
  { value: 'South', i18nKey: 'south' },
  { value: 'Southwest', i18nKey: 'southwest' },
  { value: 'West', i18nKey: 'west' },
] as const;

export type CameroonRegionValue =
  (typeof CAMEROON_REGIONS)[number]['value'];

export const CAMEROON_REGION_VALUES = CAMEROON_REGIONS.map((r) => r.value);
