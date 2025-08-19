# Header Component Documentation

## Overview
The Header component is a comprehensive navigation and SEO solution for the Job Portal application. It provides consistent navigation, SEO optimization, analytics integration, and mobile responsiveness across all pages.

## Features

### 🧭 **Navigation**
- **Desktop Navigation**: Full horizontal menu with dropdowns
- **Mobile Navigation**: Responsive hamburger menu with organized sections
- **Authentication**: Automatic login/logout handling
- **User Info**: Display current user and role
- **Active States**: Visual indicators for current page

### 🔍 **SEO Optimization**
- **Meta Tags**: Title, description, keywords
- **Open Graph**: Facebook/social media sharing
- **Twitter Cards**: Twitter-specific metadata
- **Canonical URLs**: Proper URL canonicalization
- **Robots Meta**: Control search engine indexing

### 🎯 **Analytics Integration**
- **Google Analytics 4**: Full GA4 support with gtag
- **Google Tag Manager**: GTM container support
- **Environment Variables**: Configurable via .env
- **NoScript Fallback**: GTM noscript iframe for users with JS disabled

### 📱 **Mobile Responsive**
- **Hamburger Menu**: Clean mobile navigation
- **Touch Friendly**: Optimized for mobile interactions
- **Organized Sections**: Grouped navigation items
- **Proper Spacing**: Mobile-optimized layouts

### 🔧 **Favicons & Assets**
- **Multiple Formats**: .ico, .png, Apple touch icons
- **Web Manifest**: PWA support
- **Sizes**: Multiple icon sizes for different devices

## Usage

### Basic Implementation
```tsx
import Header from '@/components/Header'

export default function MyPage() {
  return (
    <>
      <Header />
      {/* Your page content */}
    </>
  )
}
```

### With Custom SEO
```tsx
<Header 
  title="Custom Page Title - Job Portal"
  description="Custom page description for better SEO"
  keywords="custom, keywords, job portal"
  ogImage="/custom-og-image.jpg"
  canonicalUrl="https://yoursite.com/custom-page"
/>
```

### No Index (Private Pages)
```tsx
<Header 
  title="Admin Dashboard"
  noIndex={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | 'Job Portal - Find Your Dream Job' | Page title |
| `description` | string | Default description | Meta description |
| `keywords` | string | Default keywords | Meta keywords |
| `ogImage` | string | '/og-image.jpg' | Open Graph image |
| `canonicalUrl` | string | Auto-generated | Canonical URL |
| `noIndex` | boolean | false | Prevent search indexing |

## Environment Variables

Add these to your `.env.local` file:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google Tag Manager (Optional)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## Navigation Structure

### Desktop Menu
- **Jobs** (Dropdown)
  - View All Jobs
  - Create Job
  - Create Form
- **Applications**
- **Admin**
- **User Menu**
  - User Info
  - Logout

### Mobile Menu
- **Jobs Section**
  - View All Jobs
  - Create Job
  - Create Form
- **Applications**
- **Admin**
- **Account Section**
  - User Info
  - Logout

## Authentication Flow

1. **Page Load**: Header checks for authentication token
2. **Valid Token**: Fetches user data and displays navigation
3. **Invalid/No Token**: Redirects to login (except for login/home pages)
4. **Logout**: Clears token and redirects to login

## SEO Benefits

### Search Engine Optimization
- **Proper Title Tags**: Unique titles for each page
- **Meta Descriptions**: Compelling descriptions for search results
- **Structured Data**: Ready for schema markup additions
- **Canonical URLs**: Prevent duplicate content issues

### Social Media Sharing
- **Open Graph**: Rich previews on Facebook, LinkedIn
- **Twitter Cards**: Enhanced Twitter sharing
- **Custom Images**: Page-specific social images

### Analytics & Tracking
- **Google Analytics**: User behavior tracking
- **Conversion Tracking**: Goal and event tracking ready
- **GTM Integration**: Flexible tag management

## Mobile Optimization

### Responsive Design
- **Breakpoint**: `md:` (768px) for desktop/mobile switch
- **Touch Targets**: Minimum 44px touch areas
- **Readable Text**: Appropriate font sizes
- **Easy Navigation**: Intuitive mobile menu

### Performance
- **Lazy Loading**: Scripts load efficiently
- **Minimal Bundle**: Only essential code
- **Fast Rendering**: Optimized for mobile networks

## Files Structure

```
src/
├── components/
│   └── Header.tsx          # Main header component
├── styles/
│   └── tiptap.css         # Editor styles (imported in globals.css)
└── app/
    ├── globals.css        # Global styles with imports
    └── [pages]/           # Pages using Header component
```

## Migration Guide

### From Old Navigation
1. **Remove old navigation JSX** from page components
2. **Import Header** component
3. **Add Header** to page return statement
4. **Remove auth logic** (handled by Header)
5. **Remove navigation state** (dropdowns, mobile menu)

### Example Migration
```tsx
// Before
import { useState } from 'react'
import { LogOut, Menu } from 'lucide-react'

export default function OldPage() {
  const [showMenu, setShowMenu] = useState(false)
  // ... lots of navigation code
  
  return (
    <div>
      <nav>{/* Complex navigation JSX */}</nav>
      {/* Page content */}
    </div>
  )
}

// After
import Header from '@/components/Header'

export default function NewPage() {
  return (
    <>
      <Header title="Page Title" />
      {/* Page content */}
    </>
  )
}
```

## Best Practices

### SEO
- **Unique Titles**: Each page should have a descriptive title
- **Relevant Keywords**: Use page-specific keywords
- **Proper Descriptions**: Write compelling meta descriptions
- **Canonical URLs**: Set for pages with URL parameters

### Performance
- **Conditional Analytics**: Only load if environment variables are set
- **Efficient Rendering**: Header handles its own loading states
- **Mobile First**: Design for mobile, enhance for desktop

### Accessibility
- **ARIA Labels**: Navigation has proper labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with assistive technology
- **Focus Management**: Proper focus handling

## Troubleshooting

### Common Issues

1. **Authentication Loop**: Check token validity and API endpoints
2. **Missing Icons**: Ensure Lucide React icons are installed
3. **Analytics Not Loading**: Verify environment variables
4. **Mobile Menu Not Working**: Check click outside handlers

### Debug Mode
Add to component for debugging:
```tsx
console.log('Header Debug:', {
  pathname,
  user,
  loading,
  token: !!localStorage.getItem('token')
})
```

This comprehensive Header component eliminates code duplication, provides consistent UX, and includes modern web best practices for SEO, analytics, and mobile responsiveness.
