# Quick Production Migration - Add showSalary Field

## Method 1: Using Prisma (Recommended - No SQLite3 needed)

```bash
# 1. Navigate to project
cd /path/to/your/jobportal

# 2. Backup database (IMPORTANT!)
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)

# 3. Pull latest code with updated schema
git pull origin main

# 4. Sync database with schema (safe - adds column only)
npx prisma db push

# 5. Restart PM2
pm2 restart jobs-site

# 6. Check logs
pm2 logs jobs-site --lines 20
```

## Method 2: Using SQLite3 CLI (If installed)

```bash
# 1. Backup database
cd /path/to/your/jobportal
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)

# 2. Add showSalary column
sqlite3 prisma/dev.db "ALTER TABLE Job ADD COLUMN showSalary BOOLEAN NOT NULL DEFAULT 1;"

# 3. Verify (optional)
sqlite3 prisma/dev.db "PRAGMA table_info(Job);" | grep showSalary

# 4. Restart PM2
pm2 restart jobs-site

# 5. Check logs
pm2 logs jobs-site --lines 20
```

## Method 3: Install SQLite3 (If you have sudo access)

```bash
# CentOS/RHEL
sudo yum install sqlite

# Ubuntu/Debian
sudo apt-get install sqlite3

# Then use Method 2 above
```

## Important Notes
- **Method 1 is recommended** - `npx prisma db push` is safe for adding columns with defaults
- **No data loss** - This is an additive change (adds column with default value)
- `npx prisma db push` does NOT reset data, it syncs schema changes only
- Default value is `1` (TRUE) so all existing jobs will show salary
- Your code already has the updated schema.prisma from git pull

## Rollback (if needed)
```bash
pm2 stop jobs-site
cp prisma/dev.db.backup-YYYYMMDD-HHMMSS prisma/dev.db
pm2 restart jobs-site
```
