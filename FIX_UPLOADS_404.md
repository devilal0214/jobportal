# Fix Upload Files 404 Error - Deployment Guide

## Problem
- Files are uploaded correctly to `/home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/`
- But accessing `https://jobs.jaiveeru.site/uploads/careers/logo-xxx.png` returns 404
- This happens because Nginx doesn't know to serve files from the htdocs/uploads directory

## Solution
Add a dedicated Nginx location block to serve uploaded files.

## Deployment Steps

### 1. Update Application Code
```bash
cd ~/htdocs/jobs.jaiveeru.site
git pull origin main
npm run build
pm2 restart jobs-jaiveeru
```

### 2. Update Nginx Configuration

Find your Nginx vhost file:
```bash
# Usually located at:
ls -la /etc/nginx/sites-available/ | grep jobs.jaiveeru.site
# Or check CloudPanel location:
ls -la /home/jaiveeru-jobs/conf/nginx/
```

Edit the vhost file (use your actual path):
```bash
sudo nano /etc/nginx/sites-available/jobs.jaiveeru.site.conf
```

**Add this location block BEFORE the `location ~ /.well-known` block:**

```nginx
  # ✅ Serve uploaded files (logos, banners, widget images, etc.)
  location ^~ /uploads/ {
    alias /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/;
    access_log off;
    add_header Cache-Control "public, max-age=86400";
    add_header Access-Control-Allow-Origin "*";
    try_files $uri $uri/ =404;
  }
```

**Complete example placement:**
```nginx
  # ✅ Fix for Next.js static assets (JS, CSS, fonts, etc.)
  location ^~ /_next/static/ {
    alias /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/.next/static/;
    access_log off;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # ✅ Serve uploaded files (logos, banners, widget images, etc.)
  location ^~ /uploads/ {
    alias /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/;
    access_log off;
    add_header Cache-Control "public, max-age=86400";
    add_header Access-Control-Allow-Origin "*";
    try_files $uri $uri/ =404;
  }

  # Let's Encrypt/SSL challenge
  location ~ /.well-known {
    auth_basic off;
    allow all;
  }
```

### 3. Test Nginx Configuration
```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Reload Nginx
```bash
sudo systemctl reload nginx
```

### 5. Verify File Access

**Test if upload directory exists and has correct permissions:**
```bash
ls -la /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/
```

Should show files with `644` permissions (rw-r--r--).

**Test file access directly:**
```bash
# Check if file exists
ls -lh /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/logo-*.{png,svg,jpg}

# Test direct access from server
curl -I https://jobs.jaiveeru.site/uploads/careers/YOUR_LOGO_FILE.png
```

Should return:
```
HTTP/2 200
content-type: image/png
cache-control: public, max-age=86400
```

### 6. Re-Upload Test Files

Go to https://jobs.jaiveeru.site/admin/careers-settings

1. **Logo Tab**: Upload a small logo (< 1MB)
2. **Banner Tab**: Upload a small banner (< 1MB)  
3. **Footer Tab**: Add a widget with logo image (< 1MB)

Check PM2 logs to see upload paths:
```bash
pm2 logs jobs-jaiveeru --lines 50
```

You should see:
```
📁 [LOGO] Upload directory: /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers
✅ [LOGO] Logo uploaded: /home/.../htdocs/uploads/careers/logo-xxx.png -> /uploads/careers/logo-xxx.png
```

### 7. Verify on Frontend

Visit https://jobs.jaiveeru.site/careers

- Logo should display in header
- Banner should display at top
- Footer widgets with logos should show correctly
- No 404 errors in browser console (F12 -> Console)

## Troubleshooting

### Still Getting 404?

**1. Check Nginx is serving the right directory:**
```bash
# Test what Nginx returns for uploads
curl -I https://jobs.jaiveeru.site/uploads/careers/
```

**2. Check file permissions:**
```bash
# Uploads directory should be 755
ls -ld /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/
ls -ld /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/

# Files should be 644
ls -la /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/
```

If wrong permissions:
```bash
chmod 755 /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads
chmod 755 /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers
chmod 644 /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/*
```

**3. Check Nginx error logs:**
```bash
sudo tail -f /home/jaiveeru-jobs/logs/nginx/error.log
```

**4. Verify Nginx location block:**
```bash
sudo nginx -T | grep -A 10 "location.*uploads"
```

Should show:
```nginx
location ^~ /uploads/ {
    alias /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/;
    ...
}
```

**5. Check if CloudPanel is overriding config:**

If using CloudPanel, the vhost might be auto-generated. You may need to:
- Edit the template in CloudPanel UI
- Or use CloudPanel's "Additional Nginx Directives" feature

### Image Still Shows 404 After Upload

**Clear old settings and re-upload:**
```bash
cd ~/htdocs/jobs.jaiveeru.site
# View current settings in database
npx prisma studio
# Look at Settings table, find careers_logo_image, careers_banner_image, etc.
```

Then re-upload through admin panel to get fresh file paths.

## Summary

The key fix is adding the Nginx location block to serve files from `htdocs/uploads/`:

```nginx
location ^~ /uploads/ {
  alias /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/;
  access_log off;
  add_header Cache-Control "public, max-age=86400";
  add_header Access-Control-Allow-Origin "*";
  try_files $uri $uri/ =404;
}
```

This tells Nginx: "When someone requests `/uploads/careers/logo.png`, serve it from the physical path `/home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/htdocs/uploads/careers/logo.png`"

After applying this, all uploaded images (logos, banners, footer widget logos) will be accessible on the frontend! 🎉
