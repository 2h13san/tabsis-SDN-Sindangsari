import { Siswa } from '../types';

/**
 * Returns the effective PIN for a student.
 * If student has a custom pin set, returns that pin.
 * Otherwise, returns the default PIN: last 4 digits of NIS/NISN or "1234".
 */
export const getEffectiveSiswaPin = (siswa: Siswa): string => {
  if (siswa.pin && siswa.pin.trim()) {
    return siswa.pin.trim();
  }
  const cleanNis = (siswa.nis || siswa.nisn || '').replace(/\D/g, '');
  if (cleanNis.length >= 4) {
    return cleanNis.slice(-4);
  }
  return '1234';
};

/**
 * Verifies if the entered PIN matches the student's effective PIN.
 */
export const verifySiswaPin = (siswa: Siswa, inputPin: string): boolean => {
  const effectivePin = getEffectiveSiswaPin(siswa);
  return inputPin.trim() === effectivePin;
};

/**
 * Checks if the student is using a custom PIN or default PIN.
 */
export const isCustomPinSet = (siswa: Siswa): boolean => {
  return Boolean(siswa.pin && siswa.pin.trim());
};
