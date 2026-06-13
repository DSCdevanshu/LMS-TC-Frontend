import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Describes a single column to export. */
export interface ExportColumn<T = any> {
  /** Column header shown in the exported file. */
  header: string;
  /** Resolves the cell value for a given row. */
  value: (row: T) => unknown;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly datePipe = new DatePipe('en-US');

  /**
   * Exports an array of rows to a CSV file and triggers a browser download.
   * @param filename Base file name (without extension).
   * @param rows Data rows to export.
   * @param columns Column definitions (header + value resolver).
   */
  exportToCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[]): void {
    const header = columns.map(c => this.escape(c.header)).join(',');
    const lines = rows.map(row =>
      columns.map(c => this.escape(this.format(c.value(row)))).join(',')
    );
    const csv = [header, ...lines].join('\r\n');

    // BOM so Excel detects UTF-8 correctly.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this.download(blob, `${filename}.csv`);
  }

  private format(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      return this.datePipe.transform(value, 'dd MMM yyyy') ?? '';
    }
    return String(value);
  }

  private escape(value: string): string {
    const needsQuotes = /[",\r\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
