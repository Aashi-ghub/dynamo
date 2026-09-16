import ExcelJS from 'exceljs';
import type { SuiteAppMetricsRecord } from '../services/suiteAppMetricsService';

/**
 * Ported near-verbatim from the reference export harness
 * (suiteapp-metrics-export-test.html), which was verified against the real
 * SuiteAppMetrics table and its own sample output workbook. The Metrics shape
 * is dynamic per product code, so sheets are discovered from the data rather
 * than hardcoded to SD's feature names.
 */

export interface VisibleColumn {
  key: string;
  label: string;
  type?: 'number' | 'bytesToGb' | 'boolean';
}

const getByPath = (obj: any, path: string): any =>
  path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

export const labelize = (key: string): string => {
  let s = key.replace(/_/g, ' ');
  s = s.replace(/(?<!^)(?=[A-Z][a-z])/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s.replace('A I', 'AI').replace('Q R', 'QR').replace('Docu Sign', 'DocuSign');
};

const safeSheetName = (name: string, usedNames: Set<string>): string => {
  let s = name.replace(/[/\\?*[\]:]/g, '-');
  if (s.length > 31) s = s.slice(0, 31);
  if (!usedNames.has(s)) {
    usedNames.add(s);
    return s;
  }
  let n = 2;
  let candidate: string;
  do {
    const suffix = `~${n}`;
    candidate = s.slice(0, 31 - suffix.length) + suffix;
    n++;
  } while (usedNames.has(candidate));
  usedNames.add(candidate);
  return candidate;
};

const groupBy = <T>(arr: T[], fn: (item: T) => string): Record<string, T[]> =>
  arr.reduce((acc: Record<string, T[]>, item) => {
    const k = fn(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});

export const splitAccountProduct = (row: SuiteAppMetricsRecord) => {
  const [accountId, productCode] = (row.AccountID_ProductCode || '').split('_');
  return { accountId, productCode };
};

/**
 * TotalSize in the real SuiteAppMetrics data is inconsistent: some rows store it as a
 * raw byte count (e.g. 50323126429.32), others as an already-formatted string like
 * "700GB" — confirmed directly against the live table, not assumed. This normalizes
 * either shape to a GB number; returns undefined only when there's truly no value.
 */
export const parseSizeToGb = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value / 1e9;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const unitMatch = trimmed.match(/^([\d.]+)\s*(KB|MB|GB|TB)$/i);
    if (unitMatch) {
      const num = Number(unitMatch[1]);
      const scale = { KB: 1 / 1e6, MB: 1 / 1e3, GB: 1, TB: 1e3 }[unitMatch[2].toUpperCase() as 'KB' | 'MB' | 'GB' | 'TB'];
      return num * scale;
    }
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) return asNumber / 1e9;
  }
  return undefined;
};

export const formatSizeGb = (value: unknown): string => {
  const gb = parseSizeToGb(value);
  return gb === undefined ? '—' : `${gb.toFixed(1)} GB`;
};

export const formatValue = (value: unknown, type?: VisibleColumn['type']): unknown => {
  if (value === undefined) return '';
  if (type === 'boolean' || typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === '') return '—';
  if (type === 'bytesToGb') {
    const gb = parseSizeToGb(value);
    return gb === undefined ? '' : Number(gb.toFixed(2));
  }
  return value;
};

const discoverEnabledGroups = (rows: SuiteAppMetricsRecord[]): string[] => {
  const groups = new Set<string>();
  for (const row of rows) {
    for (const [groupKey, groupVal] of Object.entries(row.Metrics || {})) {
      if (groupVal && typeof groupVal === 'object' && 'Enabled' in groupVal) groups.add(groupKey);
    }
  }
  return [...groups];
};

const discoverAllFields = (rows: SuiteAppMetricsRecord[]): Array<{ group: string; field: string }> => {
  const seen = new Set<string>();
  const fields: Array<{ group: string; field: string }> = [];
  for (const row of rows) {
    for (const [groupKey, groupVal] of Object.entries(row.Metrics || {})) {
      if (!groupVal || typeof groupVal !== 'object') continue;
      for (const fieldKey of Object.keys(groupVal)) {
        const id = `${groupKey}.${fieldKey}`;
        if (!seen.has(id)) {
          seen.add(id);
          fields.push({ group: groupKey, field: fieldKey });
        }
      }
    }
  }
  return fields;
};

const addSummarySheet = (workbook: ExcelJS.Workbook, rows: SuiteAppMetricsRecord[], visibleColumns: VisibleColumn[]) => {
  const sheet = workbook.addWorksheet('Summary');
  sheet.columns = visibleColumns.map((c) => ({ header: c.label, key: c.key, width: 24 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const { accountId, productCode } = splitAccountProduct(row);
    const record = { ...row, accountId, productCode };
    const out: Record<string, unknown> = {};
    for (const c of visibleColumns) out[c.key] = formatValue(getByPath(record, c.key), c.type);
    sheet.addRow(out);
  }
};

const addAdoptionSheet = (
  workbook: ExcelJS.Workbook,
  code: string,
  rows: SuiteAppMetricsRecord[],
  usedNames: Set<string>
) => {
  const groups = discoverEnabledGroups(rows);
  if (groups.length === 0) return;
  const sheet = workbook.addWorksheet(safeSheetName(`${code} Feature Adoption`, usedNames));
  sheet.columns = [
    { header: 'Account ID', key: 'accountId', width: 16 },
    { header: 'Product Code', key: 'productCode', width: 14 },
    { header: 'Snapshot Date', key: 'Date', width: 16 },
    ...groups.map((g) => ({ header: labelize(g), key: g, width: 20 }))
  ];
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const { accountId, productCode } = splitAccountProduct(row);
    const out: Record<string, unknown> = { accountId, productCode, Date: row.Date };
    for (const g of groups) out[g] = getByPath(row, `Metrics.${g}.Enabled`) ? 'Yes' : 'No';
    sheet.addRow(out);
  }
};

const addDetailSheet = (
  workbook: ExcelJS.Workbook,
  code: string,
  rows: SuiteAppMetricsRecord[],
  usedNames: Set<string>
) => {
  const fields = discoverAllFields(rows);
  if (fields.length === 0) return;
  const sheet = workbook.addWorksheet(safeSheetName(`${code} Feature Detail`, usedNames));
  sheet.columns = [
    { header: 'Account ID', key: 'accountId', width: 16 },
    { header: 'Product Code', key: 'productCode', width: 14 },
    { header: 'Snapshot Date', key: 'Date', width: 16 },
    { header: 'Feature', key: 'feature', width: 28 },
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 18 }
  ];
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const { accountId, productCode } = splitAccountProduct(row);
    for (const { group, field } of fields) {
      const raw = getByPath(row, `Metrics.${group}.${field}`);
      if (raw === undefined) continue;
      sheet.addRow({
        accountId,
        productCode,
        Date: row.Date,
        feature: labelize(group),
        metric: labelize(field),
        value: formatValue(raw)
      });
    }
  }
};

export async function exportSuiteAppMetricsToExcel(
  rows: SuiteAppMetricsRecord[],
  visibleColumns: VisibleColumn[]
): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set<string>(['Summary']);
  const sheetNames = ['Summary'];

  addSummarySheet(workbook, rows, visibleColumns);

  const byProduct = groupBy(rows, (r) => splitAccountProduct(r).productCode);
  for (const code of Object.keys(byProduct).sort()) {
    const productRows = byProduct[code];
    const before = workbook.worksheets.length;
    addAdoptionSheet(workbook, code, productRows, usedNames);
    addDetailSheet(workbook, code, productRows, usedNames);
    sheetNames.push(...workbook.worksheets.slice(before).map((ws) => ws.name));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `suiteapp-metrics-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);

  return sheetNames;
}
