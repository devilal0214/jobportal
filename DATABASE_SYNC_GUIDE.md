# Database Synchronization Guide

## 🎯 How Local and Live Databases Work Now

### ✅ What's Fixed
- **Database file is NO longer tracked by Git** - Your `prisma/dev.db` file won't be overwritten when pushing/pulling
- **Migration files ARE tracked** - Schema changes are shared via migrations (correct behavior)
- **Each environment has its own data** - Local and live databases are independent

### 📊 What's Tracked vs Not Tracked

| File/Folder | Tracked? | Why |
|------------|----------|-----|
| `prisma/dev.db` | ❌ NO | Actual data - different per environment |
| `prisma/migrations/` | ✅ YES | Schema structure - shared across environments |
| `prisma/schema.prisma` | ✅ YES | Database schema definition |
| `.env` files | ❌ NO | Environment-specific configuration |

## 🔄 How to Sync Databases

### Option 1: Fetch Live Database to Local (Most Common)
**Use when:** You want to test with real production data locally

```powershell
# Run this on your local machine
.\fetch-live-db.ps1
```

**What it does:**
1. ✓ Backs up your current local database
2. ✓ Downloads live database via SSH
3. ✓ Replaces your local database with live data

**After this:** Your local app will have the same data as production

---

### Option 2: Push Local Database to Live (DANGEROUS!)
**Use when:** You've added test data locally and want to push it to production

⚠️ **WARNING:** This overwrites production data! Only use for testing/staging.

```powershell
# Run this on your local machine (requires confirmation)
.\push-db-to-live.ps1
```

**What it does:**
1. ✓ Asks for confirmation (type "YES")
2. ✓ Backs up live database on server
3. ✓ Uploads your local database
4. ✓ Replaces live database with local data

---

### Option 3: Schema Changes via Migrations (Best Practice)
**Use when:** You need to change database structure (add table, column, etc.)

```powershell
# 1. Create migration locally
npx prisma migrate dev --name add_new_feature

# 2. Test locally to make sure it works

# 3. Push code to Git
git add prisma/migrations/
git commit -m "Add new feature migration"
git push origin main

# 4. On live server, pull and apply migration
git pull origin main
npx prisma migrate deploy
```

**What this does:**
- ✓ Schema changes are versioned and tracked
- ✓ Live database structure updates without losing data
- ✓ Migrations can be rolled back if needed

## 📋 Common Workflows

### Workflow: Testing with Production Data Locally

```powershell
# Step 1: Fetch live database
.\fetch-live-db.ps1

# Step 2: Start your local server
npm run dev

# Step 3: Test with real data
# (Browse to http://localhost:3000)

# Step 4: When done, optionally restore your old local database
# (Backup path shown in fetch script output)
```

### Workflow: Adding a New Feature with Database Changes

```powershell
# Step 1: Update Prisma schema
# Edit: prisma/schema.prisma

# Step 2: Create migration
npx prisma migrate dev --name add_new_column

# Step 3: Test locally
npm run dev

# Step 4: Commit and push
git add prisma/
git commit -m "Add new column for feature X"
git push origin main

# Step 5: On live server
git pull origin main
npx prisma migrate deploy
pm2 restart all  # or your restart command
```

### Workflow: Regular Code Deployment (No DB Changes)

```powershell
# Local:
git add .
git commit -m "Update UI components"
git push origin main

# Live:
git pull origin main
pm2 restart all  # or your restart command
```

**Note:** Database data is NOT affected! ✅

## 🛡️ What's Protected from Git

These files are ignored and won't be affected by push/pull:

```
✅ prisma/dev.db                    # Your actual database
✅ prisma/*.db-*                    # Database journals/locks
✅ uploads/                         # User uploaded files
✅ public/uploads/                  # Images, logos, banners
✅ .env, .env.local, .env.production # Environment variables
✅ node_modules/                    # Dependencies
```

## ⚠️ Important Rules

### DO:
- ✅ Use migrations for schema changes
- ✅ Fetch live DB when you need to test with real data
- ✅ Backup before making major changes
- ✅ Test migrations locally before deploying

### DON'T:
- ❌ Manually copy database files
- ❌ Edit schema.prisma without creating a migration
- ❌ Push local DB to live without backing up first
- ❌ Commit .env files or database files to Git
- ❌ Run migrations on production without testing locally first

## 🔧 Troubleshooting

### "Database is locked" error
```powershell
# Stop the dev server, then:
npx prisma studio
# Close Prisma Studio
# Restart dev server
```

### Local and live databases out of sync after pull
**This is normal and correct!** Each environment keeps its own data.
- If you want live data locally: Run `.\fetch-live-db.ps1`
- If you made schema changes: Run `npx prisma migrate deploy` on live

### Migration failed on live
```bash
# On live server:
# 1. Check migration status
npx prisma migrate status

# 2. If needed, resolve manually
npx prisma migrate resolve --applied 20250XXX_migration_name

# 3. Try again
npx prisma migrate deploy
```

### Need to restore live database
```bash
# SSH to live server
ssh root@jobs.jaiveeru.site

# Find backups
ls -lt /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/prisma/dev.db.backup-*

# Restore (replace TIMESTAMP with actual timestamp)
cp /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/prisma/dev.db.backup-TIMESTAMP \
   /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/prisma/dev.db

# Restart app
pm2 restart all
```

## 📊 Quick Reference

| Task | Command | Where |
|------|---------|-------|
| Fetch live data | `.\fetch-live-db.ps1` | Local |
| Create migration | `npx prisma migrate dev --name xyz` | Local |
| Apply migrations | `npx prisma migrate deploy` | Live |
| View database | `npx prisma studio` | Local/Live |
| Reset local DB | `npx prisma migrate reset` | Local only! |
| Check migration status | `npx prisma migrate status` | Local/Live |

## 🎓 Understanding Prisma Migrations

Migrations are like Git commits for your database structure:

- **Schema (`schema.prisma`)**: The blueprint of your database
- **Migrations (`prisma/migrations/`)**: Step-by-step changes to get to current schema
- **Database (`dev.db`)**: The actual data

When you deploy:
1. Git tracks: schema.prisma + migrations
2. Git ignores: dev.db (actual data)
3. On live: Migrations transform the existing live database structure
4. Live data stays intact, only structure changes

This is why your data doesn't get disturbed when pushing schema changes! ✅
