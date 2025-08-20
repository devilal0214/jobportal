# JWT Authentication Debugging Tools

## Files Created/Updated

### 1. **Token Debugging Library** (`src/lib/debug-token.ts`)
- `debugToken()`: Decodes and displays JWT token information
- `validateTokenForAPI()`: Tests token validation against API endpoints

### 2. **Environment Check Library** (`src/lib/env-check.ts`)
- `checkEnvironment()`: Checks JWT_SECRET configuration and environment variables
- `createTestToken()`: Creates test tokens for validation
- `verifyTestToken()`: Verifies token with current JWT_SECRET

### 3. **Environment Debug API** (`src/app/api/debug/env/route.ts`)
- GET endpoint: `/api/debug/env`
- Returns environment diagnostics without exposing sensitive data
- Checks JWT_SECRET configuration and warns about fallback usage

### 4. **Enhanced Send-Email Page** (`src/app/admin/send-email/page.tsx`)
- Integrated comprehensive debugging in `handleDebugToken()` function
- Environment validation with fallback JWT_SECRET detection
- Enhanced error handling with detailed logging

### 5. **Documentation**
- `docs/Token-Debugging-Guide.md`: Complete troubleshooting guide
- Common causes and solutions for 401 authentication errors
- Production debugging steps and prevention strategies

## How to Debug Production 401 Errors

### Step 1: Check Environment Configuration
Visit: `https://jobs.jaiveeru.site/api/debug/env`

This will show:
- Whether JWT_SECRET is properly configured
- Warning if using fallback secret
- Server time and environment info

### Step 2: Use Debug Button
1. Go to: `https://jobs.jaiveeru.site/admin/send-email`
2. Click "Debug Token" button
3. Open browser console (F12)
4. Review detailed token information and validation results

### Step 3: Check Console Output
Look for these in the console:
```
=== MANUAL TOKEN DEBUG ===
Token found: [token info]
=== ENVIRONMENT CHECK ===
Environment diagnostics: [server config]
=== API VALIDATION TEST ===
Token validation: [success/failure details]
```

## Common Issues and Solutions

### 1. **"Server using fallback JWT_SECRET!"**
**Problem**: Production server doesn't have JWT_SECRET environment variable set.

**Solution**: Set proper JWT_SECRET in production environment:
```bash
# In production .env file
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 2. **Token Valid Locally but Not in Production**
**Causes**:
- Different JWT_SECRET between environments
- Token signed with local secret, verified with production secret
- Time synchronization issues

**Solution**: Ensure JWT_SECRET matches exactly between environments.

### 3. **Token Expired**
**Check**: Debug output shows expiration time
**Solution**: Re-login or implement token refresh

### 4. **CORS/Domain Issues**
**Check**: Token storage working across domains
**Solution**: Configure proper CORS settings

## Manual Token Verification

In browser console:
```javascript
// Quick token check
const token = localStorage.getItem('token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Expires:', new Date(payload.exp * 1000))
  console.log('Is expired:', Date.now() > payload.exp * 1000)
}
```

## Emergency Reset

If all else fails:
```javascript
// Clear all tokens and force re-login
localStorage.clear()
window.location.href = '/login'
```

## Production Environment Setup

Ensure your production server has:
1. **JWT_SECRET** environment variable set
2. **Proper CORS configuration**
3. **Synchronized server time**
4. **HTTPS enabled** for secure token transmission

## Testing Checklist

- [ ] `/api/debug/env` returns proper JWT_SECRET configuration
- [ ] Debug button shows valid token information
- [ ] Token expiration time is reasonable (7 days from creation)
- [ ] No "fallback JWT_SECRET" warnings
- [ ] API validation test passes
- [ ] Server time matches client time

## Next Steps

1. **Test the debug tools** on production site
2. **Check JWT_SECRET configuration** in production environment
3. **Compare token behavior** between local and production
4. **Review server logs** for additional error details
5. **Implement token refresh** if expiration is the issue
