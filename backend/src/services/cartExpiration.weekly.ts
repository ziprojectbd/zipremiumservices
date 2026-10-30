/**
 * Weekly campaign scheduling utilities.
 *
 * Determines whether a weekly_special campaign is currently active based on
 * its configured day-of-week + time window, handling midnight-crossing
 * schedules and recurrence end dates. All time calculations use the campaign's
 * configured timezone (default Asia/Dhaka).
 */

import { TZDate } from '../utils/timezone';

export function isWeeklyCampaignActive(
  campaign: Record<string, unknown>,
  now: Date,
  tz: string = 'Asia/Dhaka',
): boolean {
  try {
    const schedule = (campaign.weeklySchedule as unknown[]) || [];
    if (!schedule.length) return false;

    // Recurrence start boundary: campaign must not apply before this timestamp.
    if (campaign.weeklyRecurrenceStartDate) {
      const startDate = new Date(campaign.weeklyRecurrenceStartDate as string);
      if (!isNaN(startDate.getTime()) && startDate > now) return false;
    }

    const nowInTz = new TZDate(now, tz);
    const dayOfWeek = nowInTz.getDay(); // 0=Sunday ... 6=Saturday
    const timeStr = nowInTz.toTimeString(); // HH:MM

    for (const rawSlot of schedule) {
      const slot = rawSlot as Record<string, unknown>;
      if (slot.dayOfWeek == null) continue;
      if (Number(slot.dayOfWeek) !== dayOfWeek) continue;

      const start = slot.startTime ? String(slot.startTime) : '';
      const end = slot.endTime ? String(slot.endTime) : '';
      if (!start || !end) continue;

      let inWindow: boolean;
      if (end <= start) {
        // Crosses midnight: e.g. 22:00 to 02:00
        inWindow = timeStr >= start || timeStr < end;
      } else {
        inWindow = timeStr >= start && timeStr < end;
      }

      if (inWindow) {
        // Recurrence end boundary: after this timestamp, no weekly window applies.
        if (campaign.weeklyRecurrenceEndDate) {
          const endDate = new Date(campaign.weeklyRecurrenceEndDate as string);
          if (!isNaN(endDate.getTime()) && endDate <= now) return false;
        }
        return true;
      }
    }
    return false;
  } catch {
    // If anything goes wrong evaluating the weekly schedule, treat the
    // campaign as inactive rather than crashing the whole endpoint.
    return false;
  }
}

export function getNextWeeklyOccurrence(
  campaign: Record<string, unknown>,
  from: Date,
  tz: string = 'Asia/Dhaka',
): { start: Date; end: Date } | null {
  const schedule = (campaign.weeklySchedule as unknown[]) || [];
  if (!schedule.length) return null;

  const fromInTz = new TZDate(from, tz);
  const fromDay = fromInTz.getDay();
  const fromTime = fromInTz.toTimeString();

  let best: { start: Date; end: Date } | null = null;

  for (const rawSlot of schedule) {
    const slot = rawSlot as Record<string, unknown>;
    const day = Number(slot.dayOfWeek);
    const startTime = String(slot.startTime);
    const endTime = String(slot.endTime);

    // Days to add to reach this slot's day (0-6 days ahead)
    let daysAhead = (day - fromDay + 7) % 7;
    let candidateStart = new TZDate(from, tz);

    if (daysAhead === 0 && fromTime >= startTime) {
      // Today's slot already started or passed; try next week
      daysAhead = 7;
    }

    candidateStart = addDays(candidateStart, daysAhead);
    candidateStart = setTime(candidateStart, startTime);

    let candidateEnd = addDays(candidateStart, 0);
    candidateEnd = setTime(candidateEnd, endTime);

    // Handle midnight-crossing: end time might be next day
    if (endTime <= startTime) {
      candidateEnd = addDays(candidateEnd, 1);
    }

    const startDate = candidateStart.toDate();
    const endDate = candidateEnd.toDate();

    // Recurrence end check
    if (campaign.weeklyRecurrenceEndDate && startDate > new Date(campaign.weeklyRecurrenceEndDate as string)) continue;

    if (!best || startDate < best.start) {
      best = { start: startDate, end: endDate };
    }
  }

  return best;
}

function addDays(tzDate: TZDate, days: number): TZDate {
  const d = new Date(tzDate.toDate());
  d.setDate(d.getDate() + days);
  return new TZDate(d, tzDate.tz);
}

function setTime(tzDate: TZDate, hhmm: string): TZDate {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(tzDate.toDate());
  d.setHours(h, m, 0, 0);
  return new TZDate(d, tzDate.tz);
}
