/**
 * WCAG 2.2 success criteria reference for audit reports.
 */
export const WCAG_CRITERIA: Record<string, { level: string; title: string }> = {
  '1.1.1': { level: 'A', title: 'Non-text Content' },
  '1.3.1': { level: 'A', title: 'Info and Relationships' },
  '1.4.3': { level: 'AA', title: 'Contrast (Minimum)' },
  '1.4.6': { level: 'AAA', title: 'Contrast (Enhanced)' },
  '2.1.1': { level: 'A', title: 'Keyboard' },
  '2.4.1': { level: 'A', title: 'Bypass Blocks' },
  '2.4.4': { level: 'A', title: 'Link Purpose (In Context)' },
  '3.1.1': { level: 'A', title: 'Language of Page' },
  '3.3.2': { level: 'A', title: 'Labels or Instructions' },
  '4.1.2': { level: 'A', title: 'Name, Role, Value' },
};
