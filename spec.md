# StagePro

## Current State
- Puter.js auth token is hardcoded in `index.html` as `PUTER_AUTH_TOKEN` (visible in frontend source)
- Token is also stored in the backend canister (`puterToken` variable) and returned via `getPuterToken()`
- `DesignTool.tsx` and `StagingFlow.tsx` already fetch the token from the backend via `getPuterToken()` on mount and inject it into Puter before every AI call
- `getPuterToken` in the backend has no auth check (public query)

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
- `index.html`: Remove the hardcoded `PUTER_AUTH_TOKEN` entirely. Keep all popup-blocking code but initialize `window.puter.authToken` to `null` / empty string. The token will be injected at runtime from the backend fetch in `DesignTool.tsx` and `StagingFlow.tsx`.
- `main.mo`: Add `#user` permission check to `getPuterToken` so only authenticated users can retrieve the token.

### Remove
- Hardcoded token string from `index.html`

## Implementation Plan
1. Edit `index.html` to remove the token variable and all references to it; keep popup blocking, MutationObserver, iframe blocking, and continuous patching but use empty string for the initial authToken.
2. Edit `main.mo` to add `if (caller.isAnonymous()) Runtime.trap("Unauthorized")` guard to `getPuterToken`.
3. Verify `DesignTool.tsx` and `StagingFlow.tsx` already correctly fetch and inject the token from the backend before every AI call.
