# Photo Upload Implementation Guide

## Overview

This document describes the standardized photo upload implementation used across the Gold Factory Inventory System. All future photo upload features should follow this pattern for consistency.

## Key Principles

1. **Immediate Display**: Photos are returned as base64 data URLs for instant display without additional API calls
2. **Full Object Storage**: Store complete photo objects (including base64 URLs) in the database, not just IDs
3. **Null Safety**: Always include null checks when filtering/mapping photo arrays
4. **Type Safety**: Use proper TypeScript interfaces for photo objects

## Backend Implementation

### File Upload Controller

**Location**: `backend/src/modules/workers/workers.controller.ts`

```typescript
import fs from "fs";
import path from "path";
import mime from "mime-types";

export const uploadPhotos = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const category = req.body.category;

    const uploadedPhotos = files.map((file) => {
      const id = `photo-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Read file and convert to base64 data URL
      const fileBuffer = fs.readFileSync(file.path);
      const mimeType = mime.lookup(file.path) || "image/jpeg";
      const base64 = fileBuffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return {
        id,
        name: file.filename,
        originalName: file.originalname,
        url: dataUrl, // Base64 data URL for immediate display
        thumbnailUrl: dataUrl, // Same as url (can be optimized later)
        category,
        uploadedAt: new Date().toISOString(),
      };
    });

    res.json({ photos: uploadedPhotos });
  } catch (error) {
    res.status(500).json({ message: "Photo upload failed" });
  }
};
```

### Service Layer - TypeScript Interfaces

**Location**: `backend/src/modules/workers/workers.service.ts`

```typescript
interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  uploadedAt: string;
}

interface UploadedPhoto {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  uploadedAt: string;
}

interface WorkProgressData {
  formData: Record<string, any>;
  uploadedFiles: UploadedFile[] | string[]; // Support both formats
  uploadedPhotos: UploadedPhoto[] | string[]; // Support both formats
}
```

### Database Storage

**Important**: Store full photo objects, not just IDs

```typescript
export const saveWorkProgress = async (
  orderId: string,
  userId: string,
  data: WorkProgressData
) => {
  // ... validation code ...

  const workData = await prisma.departmentWorkData.upsert({
    where: {
      departmentTrackingId: tracking.id,
    },
    create: {
      departmentTrackingId: tracking.id,
      formData: (data.formData || {}) as any,
      uploadedFiles: (data.uploadedFiles || []) as any, // Store full objects
      uploadedPhotos: (data.uploadedPhotos || []) as any, // Store full objects
      workStartedAt: new Date(),
      lastSavedAt: new Date(),
      isDraft: true,
    },
    update: {
      formData: (data.formData || {}) as any,
      uploadedFiles: (data.uploadedFiles || []) as any, // Store full objects
      uploadedPhotos: (data.uploadedPhotos || []) as any, // Store full objects
      lastSavedAt: new Date(),
      isDraft: true,
    },
  });

  return workData;
};
```

## Frontend Implementation

### TypeScript Interfaces

**Location**: `frontend/src/pages/work/WorkSubmissionPage.tsx`

```typescript
interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  uploadedAt: string;
}

interface UploadedPhoto {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  uploadedAt: string;
}
```

### Upload Handler

```typescript
const handlePhotoUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  category: string
) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("photos", file);
  });
  formData.append("category", category);

  try {
    const response = await api.post(
      `/workers/work/${orderId}/upload-photos`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    const newPhotos: UploadedPhoto[] = response.data.photos;
    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    setIsDirty(true);
    toast.success("Photos uploaded successfully");
  } catch (err) {
    console.error("Photo upload error:", err);
    toast.error("Failed to upload photos");
  }
};
```

### Save Draft Handler

**Critical**: Send full photo objects, not just IDs

```typescript
const handleSaveDraft = () => {
  // Filter out null/undefined entries but keep full objects
  const filteredFiles = uploadedFiles.filter((f) => f && f.id);
  const filteredPhotos = uploadedPhotos.filter((p) => p && p.id);

  saveDraftMutation.mutate({
    formData,
    uploadedFiles: filteredFiles, // Full objects, not .map(f => f.id)
    uploadedPhotos: filteredPhotos, // Full objects, not .map(p => p.id)
  });
};
```

### Mutation Definition

```typescript
const saveDraftMutation = useMutation({
  mutationFn: async (data: {
    formData: Record<string, unknown>;
    uploadedFiles: UploadedFile[]; // Accept full objects
    uploadedPhotos: UploadedPhoto[]; // Accept full objects
  }) => {
    const response = await api.post(`/workers/work/${orderId}/save`, data);
    return response.data;
  },
  onSuccess: () => {
    toast.success("Draft saved successfully");
    queryClient.invalidateQueries({ queryKey: ["orderWork", orderId] });
  },
});
```

### Photo Display with Null Safety

```tsx
{
  /* Group photos by category with null checks */
}
{
  requirements?.photoRequirements?.map((photoReq: PhotoRequirement) => {
    const categoryPhotos = uploadedPhotos.filter(
      (p) => p && p.category === photoReq.category // Null check
    );

    return (
      <div key={photoReq.category}>
        <h3>{photoReq.label}</h3>
        <div className="photo-grid">
          {categoryPhotos.map((photo) => (
            <div key={photo.id}>
              <img
                src={photo.url} // Base64 data URL
                alt={photo.originalName}
              />
              <button onClick={() => handleRemovePhoto(photo.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handlePhotoUpload(e, photoReq.category)}
        />
      </div>
    );
  });
}
```

### Loading Saved Photos

```typescript
// Load saved photos when component mounts or data refetches
useEffect(() => {
  if (workDetails?.workData?.uploadedPhotos) {
    // Photos already include full objects with base64 URLs
    const photos = workDetails.workData.uploadedPhotos as UploadedPhoto[];
    setUploadedPhotos(photos);
  }

  if (workDetails?.workData?.uploadedFiles) {
    const files = workDetails.workData.uploadedFiles as UploadedFile[];
    setUploadedFiles(files);
  }
}, [workDetails]);
```

## Common Pitfalls to Avoid

### ❌ Don't Do This:

```typescript
// DON'T send only IDs
uploadedPhotos: uploadedPhotos.map(p => p.id)  // WRONG!

// DON'T forget null checks
uploadedPhotos.filter(p => p.category === 'BEFORE')  // Can crash!

// DON'T use string[] type when you need full objects
uploadedPhotos: string[]  // WRONG!
```

### ✅ Do This:

```typescript
// DO send full objects
uploadedPhotos: uploadedPhotos.filter(p => p && p.id)  // CORRECT!

// DO include null checks
uploadedPhotos.filter(p => p && p.category === 'BEFORE')  // Safe!

// DO use proper interface types
uploadedPhotos: UploadedPhoto[]  // CORRECT!
```

## Database Schema

The `DepartmentWorkData` table should have JSON fields:

```prisma
model DepartmentWorkData {
  id                    String   @id @default(uuid())
  departmentTrackingId  String   @unique
  formData              Json     @default("{}")
  uploadedFiles         Json     @default("[]")  // Array of UploadedFile objects
  uploadedPhotos        Json     @default("[]")  // Array of UploadedPhoto objects
  workStartedAt         DateTime?
  workCompletedAt       DateTime?
  lastSavedAt           DateTime?
  isDraft               Boolean  @default(true)
  isComplete            Boolean  @default(false)

  departmentTracking    DepartmentTracking @relation(fields: [departmentTrackingId], references: [id])
}
```

## Testing Checklist

When implementing photo uploads, test:

1. ✅ Upload photos - photos display immediately as thumbnails
2. ✅ Save draft - photos persist after save
3. ✅ Page reload - photos still visible after refresh
4. ✅ Remove photo - photo removed from state and UI
5. ✅ Multiple categories - photos grouped correctly
6. ✅ Null safety - no crashes with null/undefined entries
7. ✅ Submit work - photos included in final submission

## Performance Considerations

**Base64 Size**: Base64 encoding increases file size by ~33%. For large photos:

- Consider image compression before encoding
- Optionally store original files on disk and generate thumbnails
- For production, consider moving to cloud storage (S3, CloudFlare R2)

**Current Implementation**: Prioritizes simplicity and immediate display over size optimization. Works well for typical jewelry photos (1-3MB each).

## Future Enhancements

1. **Image Optimization**: Compress images server-side before encoding
2. **Cloud Storage**: Store photos in S3/CloudFlare R2, save URLs in database
3. **Progressive Loading**: Show low-res preview, load full-res on click
4. **Image Editing**: Add crop/rotate functionality before upload

---

**Last Updated**: January 11, 2026
**Tested With**: Work Submission Page (Phase 7)
