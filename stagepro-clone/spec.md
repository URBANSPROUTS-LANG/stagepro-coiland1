# StagePro

## Current State
The app uses Puter.js SDK (loaded via CDN script) for all AI generation:
- `DesignTool.tsx`: calls `puter.ai.txt2img` for img2img and `puter.ai.txt2vid` for video
- `StagingFlow.tsx`: calls `puter.ai.txt2img` for staging
- `index.html`: loads `https://js.puter.com/v2/?token=...` and pre-injects Puter auth token
- `backend/main.mo`: stores `puterToken` in stable storage

## Requested Changes (Diff)

### Add
- `src/frontend/src/utils/aimlApi.ts` — helper functions `generateImageAiml(prompt, imageBase64?)` and `generateVideoAiml(prompt, duration?, resolution?)` using AIML API
- AIML API key constant: `02ed5924609844e194203d610bf4079c`
- AIML base URL: `https://api.aimlapi.com`
- For img2img: POST `/v1/images/generations` with model `flux/kontext-pro/image-to-image`, image as base64 data URI in `image` field
- For video: POST `/v1/videos/generations` with model `luma-ai/dream-machine` or similar available AIML video model

### Modify
- `index.html`: Remove all Puter script tags and token injection; keep only the module script
- `StagingFlow.tsx`: Replace `window.puter` calls with `generateImageAiml` from the utility
- `DesignTool.tsx`: Replace all `puter.ai.txt2img` calls with `generateImageAiml`, replace `puter.ai.txt2vid` with `generateVideoAiml`; remove PUTER_TOKEN constant and token injection useEffect
- `backend/main.mo`: Rename `puterToken`/`getPuterToken`/`setPuterToken` to `aimlApiKey`/`getAimlApiKey`/`setAimlApiKey`; store the hardcoded key as default

### Remove
- All Puter token injection code in `DesignTool.tsx` and `StagingFlow.tsx`
- Puter script tags from `index.html`
- `window.puter` references everywhere

## Implementation Plan
1. Create `src/frontend/src/utils/aimlApi.ts` with AIML API helper functions
2. Update `index.html` to remove Puter scripts
3. Update `StagingFlow.tsx` to use `generateImageAiml`
4. Update `DesignTool.tsx` to use `generateImageAiml` and `generateVideoAiml`
5. Update `backend/main.mo` to use AIML API key storage
6. Validate (lint + typecheck + build)
