# Production Migration Instructions
# How to safely add showSalary field to your production database

## Prerequisites
- SSH access to your VPS
- Location of your production database file (usually `prisma/dev.db` or similar)
- Backup of your current database

## Step-by-Step Instructions

### 1. Connect to your VPS via SSH
```bash
ssh your-username@your-server-ip
```

### 2. Navigate to your project directory
```bash
cd /path/to/your/jobportal
```

### 3. Create a backup of your database (IMPORTANT!)
```bash
# Make a timestamped backup
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)

# Verify backup was created
ls -lh prisma/*.backup*
```

### 4. Run the SQL migration directly
```bash
# Simple one-liner - adds the column to the database
sqlite3 prisma/dev.db "ALTER TABLE Job ADD COLUMN showSalary BOOLEAN NOT NULL DEFAULT 1;"

# Verify it was added:
sqlite3 prisma/dev.db "PRAGMA table_info(Job);"
```

### 5. Restart your PM2 application
```bash
# Replace 'jobs-site' with your actual PM2 process name
pm2 restart jobs-site

# Verify it's running:
pm2 status

# Check logs for any errors:
pm2 logs jobs-site --lines 20
```

### That's it! 
Your deployed code already has the regenerated Prisma client (generated locally and pushed to production). You don't need to run `npx prisma generate` on the server.

### 6. Verify the migration
```bash
# Check application logs:
pm2 logs jobs-site --lines 50

# Test a job details page in your browser
# Visit: https://your-domain.com/careers/[job-id]
# Verify salary displays when enabled
```

## Rollback Instructions (if needed)

If something goes wrong, you can restore from backup:

```bash
# Stop the application
pm2 stop jobs-site

# Restore the backup (replace TIMESTAMP with your actual backup file date)
cp prisma/dev.db.backup-TIMESTAMP prisma/dev.db

# Restart
pm2 restart jobs-site
```

## Notes
- The showSalary field defaults to TRUE (1), meaning all existing jobs will show salary by default
- You can change individual jobs via the admin panel after migration
- The migration is backward compatible - old code will simply ignore the new field
- All changes have been committed to git, so pulling latest code will include the schema updates

## Verification Checklist
- [ ] Database backup created
- [ ] Application stopped
- [ ] Migration executed successfully
- [ ] Prisma client regenerated
- [ ] Application restarted
- [ ] Logs show no errors
- [ ] Job details page loads correctly
- [ ] Salary displays when showSalary is enabled
- [ ] Salary hidden when showSalary is disabled
