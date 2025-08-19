# 📧 Email Delivery Setup & Testing Guide

## Current Status
✅ **SMTP Configuration**: Detected in .env  
✅ **Email Templates**: 3 active templates found  
✅ **Email Logs**: System is logging emails  
⚠️ **SMTP Credentials**: Using placeholder values

## 🔧 Step 1: Configure Real SMTP Credentials

### For Gmail (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Update your .env file**:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-actual-email@gmail.com"
SMTP_PASS="your-16-digit-app-password"
FROM_EMAIL="Job Portal <your-actual-email@gmail.com>"
```

### For Other Email Providers
- **Outlook/Hotmail**: smtp-mail.outlook.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 587  
- **Custom SMTP**: Contact your email provider for settings

## 🧪 Step 2: Run Email Tests

### Quick Configuration Check
```bash
node check-email-config.js
```

### Full Email System Test
```bash
node test-email-system.js
```

**Before running**: Update the TEST_EMAILS configuration in `test-email-system.js` with real email addresses.

## 📧 Step 3: Email Scenarios Tested

### 1. Job Application Submission
**Trigger**: When a candidate submits a job application  
**Recipients**: 
- ✉️ **Candidate**: Application confirmation
- ✉️ **Admin**: New application notification  
- ✉️ **HR**: New application notification
- ✉️ **Manager**: New application notification

### 2. Application Status Changes
**Triggers**: When application status is updated  
**Status Options**: Shortlisted, Selected, Rejected  
**Recipients**:
- ✉️ **Candidate**: Status update notification
- ✉️ **Admin**: Internal status change notification
- ✉️ **HR**: Internal status change notification  
- ✉️ **Manager**: Internal status change notification

## 🎯 Step 4: Test Live Application Flow

### Test Application Submission
1. Go to: http://localhost:3000/jobs
2. Select any job and click "Apply"
3. Fill out the application form
4. Submit application
5. **Expected**: Emails sent to candidate and all system users

### Test Status Changes
1. Login as Admin: http://localhost:3000/login
2. Go to Applications section
3. Change an application status to "Shortlisted", "Selected", or "Rejected"
4. **Expected**: Emails sent to candidate and system users

## 📊 Step 5: Monitor Email Logs

### Via Database
```bash
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.emailLog.findMany({take:10, orderBy:{sentAt:'desc'}}).then(logs => console.log(logs.map(l => \`\${l.status}: \${l.to} - \${l.subject}\`))).finally(() => p.\$disconnect())"
```

### Via Admin Panel
1. Login as Admin
2. Navigate to Settings → Email Logs
3. View sent/failed email history

## ❌ Troubleshooting Common Issues

### "SMTP Connection Failed"
- ✅ Check SMTP credentials in .env
- ✅ Ensure App Password is used (not regular password)
- ✅ Check firewall/antivirus blocking port 587
- ✅ Try different SMTP provider

### "Emails Not Received"
- ✅ Check spam/junk folders
- ✅ Verify recipient email addresses
- ✅ Check email logs for delivery status
- ✅ Test with different email provider

### "Template Not Found"
- ✅ Run: `node check-email-config.js` to verify templates
- ✅ Check if email templates are marked as "active"
- ✅ Reseed database if needed: `npm run db:seed`

## 🔧 Advanced Configuration

### Custom Email Templates
1. Login as Admin
2. Go to Settings → Email Templates
3. Edit existing templates or create new ones
4. Use variables like `{{applicant_name}}`, `{{job_title}}`, etc.

### SMTP Settings for Production
```env
# Production SMTP (e.g., SendGrid, Mailgun)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
FROM_EMAIL="Job Portal <noreply@yourcompany.com>"
```

## 📋 Testing Checklist

- [ ] SMTP connection successful
- [ ] Application submission emails work
- [ ] Status change emails work (Shortlisted)
- [ ] Status change emails work (Selected)  
- [ ] Status change emails work (Rejected)
- [ ] Emails received by candidate
- [ ] Emails received by admin
- [ ] Emails received by HR
- [ ] Emails received by manager
- [ ] Email logs show "sent" status
- [ ] No emails in spam folder

## 🚀 Quick Start Commands

```bash
# 1. Check current configuration
node check-email-config.js

# 2. Test email delivery (update TEST_EMAILS first)
node test-email-system.js

# 3. Start development server
npm run dev

# 4. Test live application flow
# Visit: http://localhost:3000
```

---

**Need Help?** Check the email logs and SMTP configuration first. Most issues are related to incorrect SMTP credentials or blocked ports.
