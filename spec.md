# StagePro

## Current State
- Full AI-powered interior design app with DesignTool and StagingFlow pages
- Backend has user profiles, subscriptions, design history (roomType/style only), custom themes, Puter token management
- No storage of prompts, generated images, or input images anywhere
- No starred/bookmarked images feature
- No history page for saved designs with names and descriptions

## Requested Changes (Diff)

### Add
- **Private AI Generation Log (admin-only):** Every time a user generates an image (in both DesignTool and StagingFlow), store the full prompt, input image URL/blob reference, generated image URL/blob reference, user principal, timestamp — in a backend store only accessible to admins. Users cannot read or query this data.
- **Starred History System:** Users can "star" any generated image from DesignTool or StagingFlow. When starring, a modal prompts for a required name and optional description. The starred entry is saved to the backend under that user's account.
- **History Page:** A new "History" page/tab in the app showing all the user's starred images with name, description, thumbnail, and date. Each entry has an Edit button to update name/description and optionally regenerate or replace the saved image.
- **Blob Storage for images:** Input and generated images are stored as blobs (via blob-storage component) so URLs remain stable and accessible in history.

### Modify
- **Backend main.mo:** Add `AiGenerationLog` type (admin-only access) with prompt, inputImageId, outputImageId, userPrincipal, timestamp. Add `StarredEntry` type per user with id, name, description, imageId (blob ref), prompt used, createdAt, updatedAt. Add backend methods: `logAiGeneration` (any user can call, data hidden from users), `getAiLogs` (admin-only), `addStarredEntry`, `getMyStarredEntries`, `updateStarredEntry`, `deleteStarredEntry`.
- **DesignTool.tsx:** After image generation, show a star (☆) button on the result. Clicking it opens a modal to enter name + description, then calls `addStarredEntry`.
- **StagingFlow.tsx:** Same star button and modal on generated images.
- **App.tsx:** Add `"history"` to `AppView` type. Show a History nav item in the app when authenticated. Route to new `HistoryPage` component.

### Remove
- Nothing removed

## Implementation Plan
1. Select `blob-storage` component for image storage.
2. Add to backend:
   - `AiGenerationLog` type and admin-only store/query methods
   - `StarredEntry` type with per-user store, CRUD methods
   - `logAiGeneration(prompt, inputImageBlobId, outputImageBlobId)` — logged silently, no user access
   - `getAiGenerationLogs()` — admin only
   - `addStarredEntry(name, description, imageUrl, prompt)` → returns id
   - `getMyStarredEntries()` → array of StarredEntry
   - `updateStarredEntry(id, name, description)` 
   - `deleteStarredEntry(id)`
3. In DesignTool and StagingFlow: after successful generation, render a star icon button on the output image. On click, open StarModal (name required, description optional). On confirm, call `addStarredEntry`.
4. Create `HistoryPage.tsx`: grid of starred entries with thumbnail, name, description, date, Edit button. Edit opens inline or modal to change name/description. Delete option too.
5. Wire History into App.tsx navigation.
