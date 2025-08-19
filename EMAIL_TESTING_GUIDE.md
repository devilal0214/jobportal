# 📧 Email Testing Form - User Guide

## 🎯 Overview

The Email Testing Form allows you to test your job portal's email functionality by sending test emails for different application statuses to users with specific roles. This ensures your email system is working correctly before going live.

## 🚀 How to Access

1. **Login as Admin or HR**: Navigate to http://localhost:3000/login
2. **Go to Admin Dashboard**: Click on the admin panel
3. **Open Email Testing**: Click on the "Email Testing" card in the admin dashboard
4. **Direct URL**: http://localhost:3000/admin/email-test

## 🔧 Form Fields Explained

### 1. Application Status Dropdown
**Purpose**: Determines which email template will be used for the test

**Available Options**:
- **Shortlisted**: Candidate has been shortlisted for next round
- **Selected**: Candidate has been selected for the position  
- **Rejected**: Candidate application has been rejected
- **Under Review**: Application is currently under review
- **Interview Scheduled**: Interview has been scheduled

### 2. User Roles (Multi-select)
**Purpose**: Filters which system users will receive the test email

**Available Roles**:
- ✅ **Administrator**: Full system access users
- ✅ **Human Resources**: HR staff users  
- ✅ **Manager**: Department manager users
- ✅ **Viewer**: Read-only access users

### 3. Additional Test Email (Optional)
**Purpose**: Send test email to an additional email address not in the system

**Example**: `test@yourcompany.com`

## 📋 Current System Status

### ✅ Email Templates Available
- **Application Status Update**: For status changes (Shortlisted, Selected, Rejected, Under Review)
- **Application Received**: For new application notifications
- **Admin Notification**: For internal system notifications

### 👥 System Users Ready
- **Administrator**: 1 user (team@jaiveeru.co.in)
- **Human Resources**: 1 user (hr@jobportal.com)  
- **Manager**: 1 user (manager@jobportal.com)

### 🔗 Template Mapping
| Status | Email Template | Status |
|--------|---------------|---------|
| SHORTLISTED | Application Status Update | ✅ Ready |
| SELECTED | Application Status Update | ✅ Ready |
| REJECTED | Application Status Update | ✅ Ready |
| UNDER_REVIEW | Application Status Update | ✅ Ready |
| INTERVIEW | ⚠️ No specific template | Needs setup |

## 🧪 How to Test

### Step 1: Select Status
Choose the application status you want to test (e.g., "Shortlisted")

### Step 2: Choose Recipients
Select which user roles should receive the email:
- Check "Administrator" to send to admin users
- Check "Human Resources" to send to HR users
- Check "Manager" to send to manager users

### Step 3: Add Test Email (Optional)
Enter an additional email address if you want to receive the test email yourself

### Step 4: Send Test
Click "Send Test Emails" button

### Step 5: Verify Results
- ✅ Success message will show number of emails sent
- 📧 Check email inboxes for received test emails
- 📊 View email logs in admin panel for delivery status

## 📧 What Happens When You Send Test Emails

### Email Content
1. **Test Notice**: Yellow banner indicating this is a test email
2. **Subject Line**: Prefixed with `[TEST]` for easy identification
3. **Template Content**: Real email template with test data
4. **Variables Replaced**: 
   - `{{applicant_name}}` → "Test Candidate"
   - `{{job_title}}` → "Sample Job Position"
   - `{{status}}` → Selected status value
   - `{{application_id}}` → Test application ID

### Recipients
- **System Users**: Based on selected roles
- **Additional Email**: If provided
- **Email Logs**: All attempts logged in database

### Test Data Used
```
Candidate Name: Test Candidate
Job Title: Sample Job Position  
Application ID: TEST-[timestamp]
Status: [Selected status]
Date: Current date/time
```

## ⚙️ Prerequisites

### ✅ SMTP Configuration Required
Email testing requires proper SMTP configuration in Admin Settings:

1. **Go to**: Admin Dashboard → System Settings
2. **Configure SMTP**:
   - SMTP Host: `smtp.gmail.com` (for Gmail)
   - SMTP Port: `587`
   - SMTP User: Your email address
   - SMTP Password: App password (for Gmail)
   - From Email: System sender email

### ✅ Active Email Templates
Ensure email templates are active in Admin Dashboard → Email Templates

### ✅ System Users with Roles
Verify users have proper roles assigned in Admin Dashboard → User Management

## 🔍 Troubleshooting

### "No email template found"
- **Problem**: No active template for selected status
- **Solution**: Go to Email Templates and activate/create required template

### "No users found with selected roles"  
- **Problem**: No users assigned to selected roles
- **Solution**: Check User Management and assign roles to users

### "SMTP Connection failed"
- **Problem**: Email server configuration issue
- **Solution**: Verify SMTP settings in System Settings

### "Emails not received"
- **Problem**: Emails not reaching inbox
- **Solutions**: 
  - Check spam/junk folders
  - Verify SMTP credentials
  - Check email logs for error messages
  - Test with different email provider

## 📊 Email Logs

### Viewing Logs
1. Admin Dashboard → System Settings → Email Logs
2. Or check database table: `email_logs`

### Log Information
- **To**: Recipient email addresses
- **Subject**: Email subject line
- **Status**: `sent` or `failed`
- **Timestamp**: When email was sent
- **Template**: Which template was used

## 🚀 Production Checklist

Before using the email system in production:

- [ ] SMTP credentials configured with real email account
- [ ] Email templates customized with company branding  
- [ ] Test emails sent to all user roles
- [ ] Email delivery confirmed in multiple email providers
- [ ] Spam folder checks completed
- [ ] Email logs show successful delivery
- [ ] System users have correct email addresses
- [ ] All application statuses have corresponding templates

## 🔗 Related Admin Functions

- **Email Templates**: Create and manage email templates
- **User Management**: Assign roles to users
- **System Settings**: Configure SMTP and email settings
- **Form Builder**: Create custom application forms
- **Database Management**: View email logs and system data

## 💡 Best Practices

1. **Test Regularly**: Test email system after any configuration changes
2. **Use Real Emails**: Test with actual email addresses you can access
3. **Check Multiple Providers**: Test with Gmail, Outlook, Yahoo, etc.
4. **Monitor Logs**: Regularly check email logs for delivery issues
5. **Template Variables**: Ensure all template variables are properly configured
6. **Role Assignment**: Keep user roles updated as team changes

---

**Need Help?** 
- Check SMTP configuration first
- Verify email templates are active
- Ensure users have proper role assignments
- Review email logs for error details
