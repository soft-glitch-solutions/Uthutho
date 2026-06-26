---
name: Carpool ApplyModal Type Mismatch
description: ApplyModal.onSubmit expects a data argument; carpool handler must accept it even if unused.
---

`ApplyModal` in `components/modals/ApplyModal.tsx` defines:
```typescript
onSubmit: (data: { pickupAddress: string; additionalNotes?: string }) => Promise<void>
```

The carpool detail screen (`carpool/[id].tsx`) uses this modal for a simple "join club" action that doesn't need form data. The handler must be declared as:
```typescript
const handleSubmitApplication = async (_data?: { pickupAddress?: string; additionalNotes?: string }) => {
```

**Why:** TypeScript strict function type checking — passing a zero-arg function where a one-arg function is expected is a type error even if JS runtime would tolerate it.

**How to apply:** Any screen using ApplyModal must match its onSubmit signature. If the form data isn't needed, accept and ignore `_data?`.
