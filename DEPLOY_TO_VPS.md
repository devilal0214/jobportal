# Deploy Updates to VPS - Complete Guide

## 🔧 FIRST: Resolve Current Conflict on VPS

You have an unresolved merge conflict. Run these commands:

```bash
# 1. Navigate to project directory
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site

# 2. Check what files have conflicts
git status

# 3. Abort the current merge/rebase (clean slate)
git merge --abort
# OR if you were rebasing:
git rebase --abort

# 4. Stash any local changes (especially database)
git stash push prisma/dev.db -m 'Stash production database'

# 5. Now pull cleanly
git pull origin main

# 6. Install dependencies
npm install

# 7. Run seed script to update permissions
node prisma/seed-roles.js

# 8. Restart application
pm2 restart jobs-jaiveeru

# 9. Verify it's working
pm2 status
pm2 logs jobs-jaiveeru --lines 50
```

## 📋 STANDARD DEPLOYMENT WORKFLOW (Use This Every Time)

### Option A: Simple Deployment (Recommended)

```bash
# 1. Go to project directory
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site

# 2. Stash database file (if it exists and has local changes)
git stash push prisma/dev.db -m 'Stash production database' 2>/dev/null || true

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies (if package.json changed)
npm install

# 5. Run database migrations (if schema changed)
npx prisma migrate deploy

# 6. Run seed scripts (if permissions/roles changed)
node prisma/seed-roles.js

# 7. Restart application
pm2 restart jobs-jaiveeru

# 8. Check logs
pm2 logs jobs-jaiveeru --lines 30
```

### Option B: Force Pull (When you have conflicts and want to discard VPS changes)

```bash
# ⚠️ WARNING: This discards ALL local changes on VPS
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site

# Backup database first
cp prisma/dev.db prisma/dev.db.backup

# Reset to remote state
git fetch origin
git reset --hard origin/main

# Restore database
mv prisma/dev.db.backup prisma/dev.db

# Continue with normal deployment
npm install
node prisma/seed-roles.js
pm2 restart jobs-jaiveeru
```

## ✅ What This Will Update

1. **All API Routes** - Now use permission-based checks instead of hardcoded roles
2. **Manager Role** - Can now create, read, and update forms
3. **System Roles** - Admin can now edit and delete (except Administrator role)
4. **Database Permissions** - Manager role will get forms permissions

## 📝 Expected Output from Seed Script

You should see:
```
🌱 Seeding roles and permissions system...
📋 Creating permissions...
✅ Created 30 permissions
👥 Creating system roles...
✅ Created system roles
🔐 Assigning permissions to roles...
✅ Assigned permissions to system roles
```

## 🔍 Verify Deployment

After deployment, test:
1. Login as Manager user
2. Navigate to Forms management
3. Try creating a new form - should work without 403 error

## 📌 Future Database Changes

From now on:
- Database file (`prisma/dev.db`) is NOT tracked in git
- Use `node prisma/seed-roles.js` to update permissions
- Use migrations for schema changes: `npx prisma migrate deploy`

## 🔄 Common Scenarios

### Scenario 1: Code Changes Only
```bash
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site
git stash push prisma/dev.db -m 'Stash DB' 2>/dev/null || true
git pull origin main
pm2 restart jobs-jaiveeru
```

### Scenario 2: Database Schema Changed
```bash
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site
git stash push prisma/dev.db -m 'Stash DB' 2>/dev/null || true
git pull origin main
npx prisma migrate deploy
pm2 restart jobs-jaiveeru
```

### Scenario 3: New Role/Permission Added
```bash
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site
git stash push prisma/dev.db -m 'Stash DB' 2>/dev/null || true
git pull origin main
node prisma/seed-roles.js
pm2 restart jobs-jaiveeru
```

### Scenario 4: Merge Conflict (Like Current Issue)
```bash
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site
git merge --abort || git rebase --abort
git stash push prisma/dev.db -m 'Stash DB' 2>/dev/null || true
git pull origin main
npm install
node prisma/seed-roles.js
pm2 restart jobs-jaiveeru
```

## 🎯 Quick Commands Reference

```bash
# Check status
pm2 status
pm2 logs jobs-jaiveeru --lines 50

# View application
curl http://localhost:3001

# Check git status
git status

# View recent commits
git log --oneline -5

# Check if app is listening
netstat -tlnp | grep 3001
```

## 🆘 Troubleshooting

If you get permission errors:
```bash
# Check if seed ran successfully
cat /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/prisma/dev.db

# Re-run seed if needed
node prisma/seed-roles.js

# Check PM2 logs
pm2 logs jobs-jaiveeru --lines 100
```
