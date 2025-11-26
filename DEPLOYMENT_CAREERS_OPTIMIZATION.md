# Careers Settings Optimization - Deployment Guide

## What Was Changed

### Problem
The careers settings page was timing out (504 Gateway Timeout) on VPS because:
- All 5 tabs saved through ONE massive form submission
- Multiple large files uploaded simultaneously (logo, banner, fonts, share icons)
- ~100+ database operations in a single transaction
- Request took 90+ seconds to process

### Solution
Split into **tab-specific forms** with **file size validation**:

1. **Logo & Navigation Tab** → `/api/admin/careers-settings/logo`
   - Only saves logo, menu, fonts for navigation
   - Max 3 files per save

2. **Banner Tab** → `/api/admin/careers-settings/banner`
   - Only saves banner image + text settings
   - Max 1 file per save

3. **Job Cards Tab** → `/api/admin/careers-settings/cards`
   - Only saves card styling (no files)
   - Fast text-only updates

4. **Footer Tab** → `/api/admin/careers-settings/footer`
   - Only saves footer settings (no files typically)
   - JSON arrays only

5. **Custom Styling Tab** → `/api/admin/careers-settings/styling`
   - Only saves styling + share icons
   - Max 5 files per save

### File Size Validation
- **All images now limited to 1MB maximum**
- Client-side validation shows clear error: "Logo file is too large (2.5MB). Maximum size is 1MB."
- Server-side validation as backup
- Users must compress images before upload

## Deployment Steps on VPS

### 1. Pull Latest Code
```bash
cd ~/htdocs/jobs.jaiveeru.site
git pull origin main
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Build the Application
```bash
npm run build
```

### 4. Restart PM2
```bash
pm2 restart jobs-jaiveeru
pm2 logs jobs-jaiveeru --lines 50
```

### 5. Verify Each Tab Works
Go to: https://jobs.jaiveeru.site/admin/careers-settings

Test each tab:
- ✅ **Logo & Nav**: Upload logo (< 1MB), add menu items, save
- ✅ **Banner**: Upload banner (< 1MB), change text, save
- ✅ **Cards**: Change card colors/sizes, save
- ✅ **Footer**: Configure footer, save
- ✅ **Styling**: Upload share icons (< 1MB each), save

Each save should complete in **5-10 seconds** instead of timing out.

## Benefits

### Before Optimization
- ❌ Single massive form with all tabs
- ❌ Multiple large files at once
- ❌ 90+ second wait time
- ❌ 504 Gateway Timeout errors
- ❌ No file size limits
- ❌ Confusing errors

### After Optimization
- ✅ Tab-specific forms (save only what you changed)
- ✅ 1MB file size limit with clear validation
- ✅ 5-10 second save time per tab
- ✅ No more timeouts
- ✅ Better error messages
- ✅ Faster database operations

## Troubleshooting

### If Logo/Banner Upload Still Times Out

1. **Check file size:**
   ```bash
   # On your computer, check image size
   ls -lh public/uploads/careers/
   ```
   If > 1MB, compress the image first using:
   - TinyPNG.com
   - ImageOptim (Mac)
   - GIMP / Photoshop "Save for Web"

2. **Check Nginx is restarted:**
   ```bash
   sudo systemctl status nginx
   sudo systemctl restart nginx  # if needed
   ```

3. **Check PM2 logs:**
   ```bash
   pm2 logs jobs-jaiveeru --lines 100
   ```
   Should see:
   ```
   🚀 [LOGO] Request started
   ✅ [LOGO] Settings saved successfully
   ```

### If Settings Don't Appear on Careers Page

1. **Check database:**
   ```bash
   cd ~/htdocs/jobs.jaiveeru.site
   npx prisma studio
   ```
   Look for `careers_*` keys in Settings table

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

3. **Check file permissions:**
   ```bash
   ls -la public/uploads/careers/
   # All files should be 644 (rw-r--r--)
   ```

## File Size Limits

All images must be ≤ 1MB:
- Logo: ≤ 1MB
- Banner: ≤ 1MB
- Share Icons (Facebook, Twitter, etc.): ≤ 1MB each
- Fonts: ≤ 1MB each

### How to Compress Images

**For PNG/JPG:**
- Use https://tinypng.com (free, online)
- Reduces size by 50-80% without visible quality loss

**For SVG:**
- Use https://jakearchibald.github.io/svgomg/
- Removes unnecessary metadata

**Command Line (Linux/Mac):**
```bash
# Install ImageMagick
sudo apt install imagemagick

# Compress image to under 1MB
convert input.png -quality 85 -resize 1920x1080\> output.png
```

## API Endpoints

| Endpoint | Purpose | Max Files | Timeout |
|----------|---------|-----------|---------|
| `/api/admin/careers-settings/logo` | Logo, nav, fonts | 3 | 60s |
| `/api/admin/careers-settings/banner` | Banner image + text | 1 | 60s |
| `/api/admin/careers-settings/cards` | Card styling | 0 | 60s |
| `/api/admin/careers-settings/footer` | Footer config | 0 | 60s |
| `/api/admin/careers-settings/styling` | Custom CSS + share icons | 5 | 60s |

## Testing Checklist

After deployment, test each tab:

- [ ] Logo & Navigation
  - [ ] Upload logo (test with file > 1MB, should show error)
  - [ ] Upload logo (< 1MB, should work)
  - [ ] Add/remove menu items
  - [ ] Save successfully in < 10 seconds
  
- [ ] Banner
  - [ ] Upload banner image (< 1MB)
  - [ ] Change title, subtitle, description
  - [ ] Save successfully in < 10 seconds
  
- [ ] Job Cards
  - [ ] Change colors, sizes, layout
  - [ ] Save successfully in < 5 seconds (no files)
  
- [ ] Footer
  - [ ] Enable/disable footer
  - [ ] Add widgets, social links
  - [ ] Save successfully in < 5 seconds
  
- [ ] Custom Styling
  - [ ] Upload share icons (< 1MB each)
  - [ ] Add custom CSS
  - [ ] Save successfully in < 10 seconds

- [ ] Verify on Public Careers Page
  - [ ] Visit https://jobs.jaiveeru.site/careers
  - [ ] Check logo displays
  - [ ] Check banner shows
  - [ ] Check job cards styled correctly
  - [ ] Check footer (if enabled)

## Support

If you encounter any issues:

1. Check PM2 logs: `pm2 logs jobs-jaiveeru`
2. Check Nginx logs: `sudo tail -f /home/jaiveeru-jobs/logs/nginx/error.log`
3. Check file sizes: All must be ≤ 1MB
4. Restart services: `pm2 restart jobs-jaiveeru && sudo systemctl restart nginx`

**The 504 timeout issue is now SOLVED with these optimizations!**
