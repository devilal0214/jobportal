# 📧 SMTP Test Form - Quick Guide

## 🎯 Purpose
Test your SMTP configuration by sending a simple test email to verify that your email server settings are working correctly.

## 🚀 Access
- **URL**: http://localhost:3000/admin/smtp-test
- **From Admin Dashboard**: Click on "SMTP Test" card

## 📝 Form Fields

### Email Address (Required)
- **Purpose**: Recipient email address for the test email
- **Example**: `your.email@gmail.com`
- **Note**: Use an email address you can access to verify delivery

### Message (Optional)
- **Purpose**: Custom message to include in the test email
- **Example**: `Testing SMTP configuration for production deployment`
- **Note**: Will be displayed in a highlighted section of the email

## ⚙️ How It Works

### SMTP Configuration Priority
1. **Database Settings** (Primary): Checks `settings` table for SMTP configuration
2. **Environment Variables** (Fallback): Uses `.env` file values if database settings not found

### Database Settings Keys
- `smtp_host` - SMTP server hostname
- `smtp_port` - SMTP server port (usually 587)
- `smtp_user` - SMTP username/email
- `smtp_pass` - SMTP password
- `from_email` - From email address

### Environment Variables
- `SMTP_HOST`
- `SMTP_PORT` 
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`

## 📧 Test Email Content

The test email includes:
- ✅ Clear indication it's a test email
- 📊 Technical details (SMTP host, port, timestamp)
- 💬 Your custom message (if provided)
- 🎯 Success confirmation message

## 🔍 Response Types

### ✅ Success Response
```json
{
  "success": true,
  "message": "Test email sent successfully to user@example.com",
  "details": {
    "messageId": "...",
    "response": "250 OK",
    "accepted": ["user@example.com"],
    "rejected": [],
    "settings": {
      "host": "smtp.gmail.com",
      "port": 587,
      "fromEmail": "noreply@jobportal.com"
    }
  }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "message": "SMTP connection failed",
  "details": {
    "error": "Invalid login credentials",
    "settings": {
      "host": "smtp.gmail.com",
      "port": 587
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### "SMTP settings not configured"
- **Problem**: No SMTP settings found
- **Solution**: Configure SMTP in Admin Settings or add to .env file

#### "SMTP connection failed"
- **Problem**: Cannot connect to email server
- **Solutions**:
  - Check SMTP host and port
  - Verify internet connection
  - Check firewall settings

#### "Invalid login credentials"
- **Problem**: Authentication failed
- **Solutions**:
  - Verify SMTP username/password
  - For Gmail: Use App Password instead of regular password
  - Check if 2FA is enabled

#### "Test email not received"
- **Problem**: Email sent but not delivered
- **Solutions**:
  - Check spam/junk folder
  - Verify recipient email address
  - Check email logs in admin panel

### Email Provider Specific Settings

#### Gmail
```
Host: smtp.gmail.com
Port: 587
Security: TLS
Username: your-email@gmail.com
Password: App Password (not your regular password)
```

#### Outlook/Hotmail
```
Host: smtp-mail.outlook.com
Port: 587
Security: TLS
Username: your-email@outlook.com
Password: Your account password
```

#### Yahoo
```
Host: smtp.mail.yahoo.com
Port: 587
Security: TLS
Username: your-email@yahoo.com
Password: App Password
```

## 📊 Logging

All test email attempts are logged in the database:
- **Table**: `email_logs`
- **Template ID**: `smtp-test`
- **Status**: `sent` or `failed`
- **Access**: Admin Dashboard → System Settings → Email Logs

## 🔐 Security Notes

- SMTP passwords are never displayed in responses
- Test emails are clearly marked as tests
- All attempts are logged for audit purposes
- Database settings take priority over environment variables

## 🚀 Production Checklist

Before using in production:
- [ ] Test with your actual SMTP provider
- [ ] Verify emails arrive in inbox (not spam)
- [ ] Test with multiple email providers (Gmail, Outlook, etc.)
- [ ] Check email logs for any delivery issues
- [ ] Ensure SMTP credentials are properly secured
- [ ] Configure proper "From" email address

---

**Quick Test**: Navigate to `/admin/smtp-test`, enter your email, and click "Send Test Email" to verify your SMTP configuration is working!
