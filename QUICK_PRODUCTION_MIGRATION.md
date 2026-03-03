# Quick Production Migration - Add showSalary Field

## SSH Commands (Copy & Paste)

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

## That's it!
- No need to run `npx prisma generate` (your code already has it)
- No need to stop the app before running SQL (SQLite handles it)
- Default value is `1` (TRUE) so all existing jobs will show salary

## Rollback (if needed)
```bash
pm2 stop jobs-site
cp prisma/dev.db.backup-YYYYMMDD-HHMMSS prisma/dev.db
pm2 restart jobs-site
```
