---
name: Driver fetch pattern
description: Supabase query pattern for the drivers table — must use maybeSingle not single
---

# Rule
Always use `.maybeSingle()` when querying `drivers` by `user_id`. Most users are NOT drivers, so `.single()` throws `PGRST116` ("JSON object requested, multiple (or no) rows returned") for them.

**Why:** Supabase `.single()` raises a hard error when 0 rows match. Non-driver users have no `drivers` row, so this crashes every time they visit a driver-related screen.

**How to apply:**
```ts
const { data: driver, error } = await supabase
  .from('drivers')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle();          // returns null, not error, when no row exists

if (error || !driver) {
  if (error) console.error('Error fetching driver:', error);
  // handle gracefully — user is not a driver
  return;
}
```

Also: when redirecting on error from driver-dashboard, use `router.canGoBack() ? router.back() : router.replace('/(tabs)/home')` to avoid the "GO_BACK not handled" warning when the dashboard is the first screen.
