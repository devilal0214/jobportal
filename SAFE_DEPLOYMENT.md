# Safe Deployment Guide - Preventing Data Loss

## Problem Fixed
Git was tracking user-uploaded files (logos, banners, job images, resumes). When you pushed/pulled changes, these files got overwritten, breaking the live site.

## What Changed
- `/uploads/**` and `/public/uploads/**` are now ignored by Git
- Only directory structure (.gitkeep files) is tracked
- User-uploaded content stays independent on local and live

## How to Deploy to Live (First Time After This Fix)

### Step 1: Push Changes from Local
```bash
git push origin main
```

### Step 2: On Live Server - Backup Current Uploads
```bash
# SSH into your live server, then:
cd /path/to/your/project

# Create a backup of current uploads
cp -r uploads uploads_backup_$(date +%Y%m%d)
cp -r public/uploads public/uploads_backup_$(date +%Y%m%d)
```

### Step 3: Pull Changes on Live
```bash
git pull origin main
```

### Step 4: Restore Live Uploads (if they were deleted)
```bash
# If git pull deleted your upload files, restore from backup:
cp -r uploads_backup_*/* uploads/
cp -r public/uploads_backup_*/* public/uploads/
```

## Future Deployments (Normal Process)

From now on, when you push/pull changes:

1. **Local to Git:**
   ```bash
   git push origin main
   ```

2. **Git to Live:**
   ```bash
   # On live server
   git pull origin main
   ```

Your uploaded files will NOT be affected! ✅

## What's Protected Now

✅ `/uploads/` - Resume PDFs and documents
✅ `/public/uploads/careers/` - Career page logos, banners, social icons  
✅ `/public/uploads/jobs/` - Job posting images
✅ `prisma/*.db` - Database files
✅ `.env*` - Environment variables

## Important Notes

- **Keep uploads separate**: Never manually copy uploads from local to live or vice versa
- **Live server uploads**: Any images/files uploaded on live stay on live
- **Local server uploads**: Your local test uploads stay local
- **Database**: Your local and live databases are separate (not synced via Git)

## If Something Goes Wrong

If uploads get deleted after git pull:
1. Check your backup folders (created in Step 2)
2. Restore with: `cp -r *_backup_*/* destination/`
3. Verify files are back with: `ls -la uploads/ public/uploads/`

## Testing the Fix

1. Upload a test image on live site
2. Push some code changes from local
3. Pull on live server
4. Verify the test image is still there ✅
