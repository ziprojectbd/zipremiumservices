/**
 * Timezone-aware date wrapper for campaign scheduling.
 *
 * Uses Intl.DateTimeFormat with the IANA timezone name (e.g. 'Asia/Dhaka')
 * so we never depend on the server's local timezone or external libraries.
 */

type TZField = 'weekday' | 'hour' | 'minute';

export class TZDate {
  private readonly date: Date;
  readonly tz: string;

  constructor(date: Date, tz: string) {
    this.date = new Date(date.getTime());
    this.tz = tz;
  }

  getDay(): number {
    return this._getField('weekday', (v: number) => {
      // Intl weekday: 1=Monday ... 7=Sunday -> convert to 0=Sunday ... 6=Saturday
      return v === 7 ? 0 : v;
    });
  }

  getHours(): number {
    return this._getField('hour', (v: number) => v);
  }

  getMinutes(): number {
    return this._getField('minute', (v: number) => v);
  }

  toTimeString(): string {
    const h = String(this.getHours()).padStart(2, '0');
    const m = String(this.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  toDate(): Date {
    return new Date(this.date.getTime());
  }

  private _getField(
    field: TZField,
    transform: (v: number) => number,
  ): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.tz,
      [field]: '2-digit',
    } as unknown as Intl.DateTimeFormatOptions)
      .formatToParts(this.date);
    const part = parts.find((p) => p.type === field);
    return transform(part ? Number(part.value) : 0);
  }
}
