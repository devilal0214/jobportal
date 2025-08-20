# Token Authentication Debugging Guide

## Common Causes of 401 "Invalid Token" Errors in Production

### 1. **JWT_SECRET Mismatch**
**Problem**: Different JWT_SECRET between local and production environments.

**Check**:
```bash
# On production server
echo $JWT_SECRET
# or check your environment variables
```

**Fix**: Ensure the JWT_SECRET in your production `.env` file matches exactly with the one used to sign the tokens.

### 2. **Token Expiration**
**Problem**: Tokens expire faster in production or have different expiration settings.

**Debug**: Use the debug button on `/admin/send-email` page to check token expiration.

**Fix**: 
- Check token expiration time in JWT payload
- Implement token refresh mechanism
- Extend token expiration time

### 3. **Domain/CORS Issues**
**Problem**: Cookies or localStorage may not work properly across different domains.

**Check**:
```javascript
// In browser console
console.log(localStorage.getItem('token'))
console.log(document.domain)
```

**Fix**: Ensure your production domain is properly configured for token storage.

### 4. **Time Synchronization**
**Problem**: Server time differs significantly from client time.

**Check**: Compare server time with client time.

**Fix**: Synchronize server time with NTP.

### 5. **Token Format Issues**
**Problem**: Token gets corrupted during transmission or storage.

**Debug**: Check token format and length.

### 6. **Environment Variables Not Loaded**
**Problem**: Production server doesn't load `.env` file properly.

**Check**:
```bash
# Verify environment variables are loaded
printenv | grep JWT_SECRET
```

**Fix**: Ensure environment variables are properly set in production.

## Quick Debugging Steps

1. **Open Browser Console** on the problematic page
2. **Click "Debug Token" button** - this will log detailed token information
3. **Check Console Output** for:
   - Token presence
   - Token format
   - Expiration time
   - Decoded payload

## Manual Token Check

Run this in browser console:
```javascript
// Get token info
const token = localStorage.getItem('token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token expires:', new Date(payload.exp * 1000))
  console.log('Is expired:', Date.now() > payload.exp * 1000)
  console.log('User ID:', payload.userId)
  console.log('Role:', payload.role)
} else {
  console.log('No token found')
}
```

## Production Fixes

### Option 1: Re-login
```javascript
// Clear token and force re-login
localStorage.removeItem('token')
window.location.href = '/login'
```

### Option 2: Check JWT_SECRET
Ensure production JWT_SECRET matches the one used to create tokens.

### Option 3: Verify API Endpoint
Test the API endpoint directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://jobs.jaiveeru.site/api/auth/me
```

## Emergency Fixes

If token issues persist:

1. **Clear all tokens**: `localStorage.clear()`
2. **Hard refresh**: Ctrl+F5 or Cmd+Shift+R
3. **Check production logs** for specific error messages
4. **Verify JWT_SECRET** in production environment
5. **Check server time synchronization**

## Prevention

1. **Use consistent JWT_SECRET** across environments
2. **Implement token refresh** mechanism
3. **Add proper error handling** for expired tokens
4. **Monitor token expiration** times
5. **Use secure token storage** methods
