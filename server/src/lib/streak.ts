import { one, query } from "./db.js";

// Compute the user's daily streak (Africa/Luanda days). Days with at least one
// answered question count as active. Gaps can be bridged by streak freezes:
// when the user holds freezes (profiles.streak_freezes), missing days between
// two active days are consumed automatically (one freeze per day, recorded in
// streak_freeze_uses so the day stays protected on future reads).
export async function computeStreak(userId: string): Promise<number> {
  const [daysR, frozenR, profR, todayR] = await Promise.all([
    query(
      `select distinct (answered_at at time zone 'Africa/Luanda')::date::text as day
         from question_attempts
        where user_id = $1 and answered_at >= now() - '90 days'::interval`,
      [userId],
    ),
    query(
      `select day::text as day from streak_freeze_uses
        where user_id = $1 and day >= (now() at time zone 'Africa/Luanda')::date - 90`,
      [userId],
    ),
    one<{ streak_freezes: number }>(
      "select streak_freezes from profiles where id = $1",
      [userId],
    ),
    one<{ today: string }>(
      "select (now() at time zone 'Africa/Luanda')::date::text as today",
      [],
    ),
  ]);

  const protectedDays = new Set<string>([
    ...daysR.rows.map((r: any) => r.day),
    ...frozenR.rows.map((r: any) => r.day),
  ]);
  let freezes = profR?.streak_freezes ?? 0;

  // Walk back from today. Day 0 (today) never breaks the streak — it isn't
  // over yet. A missing past day is bridged by consuming freezes if the gap
  // is short enough AND there is an active day on the far side (a freeze must
  // preserve a streak, not fabricate one).
  const base = new Date(`${todayR?.today ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const dayKey = (i: number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  };

  let streak = 0;
  const toConsume: string[] = [];
  for (let i = 0; i < 90; i++) {
    const key = dayKey(i);
    if (protectedDays.has(key)) {
      streak++;
      continue;
    }
    if (i === 0) continue; // today still in progress

    // Gap: count consecutive missing days and check the far side.
    let j = i;
    while (j < 90 && !protectedDays.has(dayKey(j))) j++;
    const gap = j - i;
    if (j >= 90 || gap > freezes) break; // unbridgeable → streak ends here
    for (let k = i; k < j; k++) toConsume.push(dayKey(k));
    freezes -= gap;
    streak += gap;
    i = j - 1; // resume at the active day on the far side
  }

  if (toConsume.length > 0) {
    try {
      const values = toConsume.map((_, i) => `($1, $${i + 2}::date)`).join(",");
      await query(
        `insert into streak_freeze_uses (user_id, day) values ${values}
         on conflict do nothing`,
        [userId, ...toConsume],
      );
      await query(
        "update profiles set streak_freezes = greatest(0, streak_freezes - $2) where id = $1",
        [userId, toConsume.length],
      );
    } catch { /* non-critical — never fail the caller because of this */ }
  }

  return streak;
}
