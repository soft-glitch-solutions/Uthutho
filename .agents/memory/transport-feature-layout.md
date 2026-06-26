---
name: Transport Feature Layout
description: What exists vs what was missing for school-transport and carpool features.
---

All supporting files for the transport features already existed before this session:
- `types/transport.ts` — SchoolTransport, Driver, DriverProfile interfaces
- `services/transportService.ts` — fetchTransportDetails (tries `transport_with_driver` view, falls back to separate queries), checkIfApplied (checks `school_transport_applications` table)
- `components/transport/` — SkeletonLoading, TransportHeader, AvailabilityBanner, StatsGrid, PickupInfo, DriverInfo, ApplyButton
- `components/modals/ApplyModal.tsx` — form with pickupAddress + additionalNotes, used by school transport
- `components/modals/StatusModal.tsx` — animated modal with success/error/warning/info/loading types

**What was missing:** `app/(app)/transport-application.tsx` — the screen that `school-transport/[id].tsx` pushes to when user taps "Apply". It receives `transportId`, `driverId`, `transportName`, `schoolArea` params and inserts into `school_transport_applications` table.

**Why:** The detail screen delegates the full application form to a separate route rather than using the ApplyModal inline.
