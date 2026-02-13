# Global Project Manager Chat

## Overview

The Global Project Manager Chat is a floating chat widget that provides 24/7 support and guidance to users throughout the AgentVerse application. The chat is accessible from any page via a floating action button in the bottom-right corner.

## Features

### 1. Floating Action Button
- **Location**: Bottom-right corner of the screen
- **Icon**: Message square icon with gradient background (purple to pink)
- **Visibility**: Present on all pages (home, login, agents, game, visualization, etc.)
- **Styling**: Matches the application's design system with hover animations and focus states

### 2. Chat Window
- **Dimensions**: 400x600px (desktop), responsive on mobile devices
- **Header**: Gradient header with "Project Manager" title and close button
- **Content**: Embedded iframe loading the n8n chat interface
- **URL**: `https://n8n.pavlin.dev/webhook/c8f1bc9a-da20-4755-a083-792e0d10964b/chat`

### 3. Responsive Design
- On mobile devices (< 640px), the chat window expands to nearly full-screen
- Maintains proper z-index to appear above other content
- Smooth transitions for opening and closing

## Technical Implementation

### Component Structure

```
app/
├── components/
│   ├── GlobalChat.tsx          # Main chat component
│   └── Providers.tsx            # Global provider wrapper
└── layout.tsx                   # Root layout
```

### File: `app/components/GlobalChat.tsx`

The GlobalChat component is a client-side component (`'use client'`) that manages:
- Chat open/close state
- Floating action button rendering
- Chat window with embedded iframe
- Responsive styling

### File: `app/components/Providers.tsx`

The Providers component imports and renders GlobalChat globally:
```tsx
import GlobalChat from './GlobalChat'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalChat />
    </>
  )
}
```

### Integration

The GlobalChat is rendered in the root layout (`app/layout.tsx`) through the Providers component, ensuring it appears on every page of the application.

## User Interface

### Chat Button States
1. **Closed State**: Circular button with message icon visible
2. **Open State**: Button hidden, chat window displayed
3. **Hover State**: Button scales up slightly with darker gradient
4. **Focus State**: Ring indicator for keyboard navigation

### Chat Window Components
1. **Header**:
   - Gradient background (purple to pink)
   - Message icon + "Project Manager" title
   - Close button (X icon)

2. **Content Area**:
   - Full-size iframe
   - No visible borders
   - Clipboard access enabled for rich interactions

## Styling

### Tailwind Classes Used
- `fixed bottom-6 right-6` - Positioning
- `z-50` - High z-index for overlay
- `bg-gradient-to-r from-purple-600 to-pink-600` - Brand gradient
- `rounded-full` / `rounded-lg` - Border radius
- `shadow-lg` / `shadow-2xl` - Drop shadows
- `hover:scale-110` - Interactive animations
- `focus:ring-2` - Accessibility focus indicators

### Mobile Responsiveness
- Custom JSX styles handle mobile breakpoints
- Chat window adapts to viewport size
- Maintains usability on small screens

## Accessibility

- **ARIA Labels**: Proper labels for screen readers
  - `aria-label="Open chat with project manager"`
  - `aria-label="Close chat"`
- **Keyboard Navigation**: Focus states and keyboard accessible
- **Focus Management**: Proper focus ring indicators

## Use Cases

1. **New User Onboarding**: Help users understand the platform
2. **Feature Discovery**: Guide users to specific features
3. **Troubleshooting**: Provide support for common issues
4. **Feedback Collection**: Gather user feedback and suggestions
5. **Project Management**: Coordinate tasks and project status

## Future Enhancements

Potential improvements for future versions:
- Notification badge for unread messages
- Minimize/maximize animations
- Position customization (left/right side)
- Theming options
- Offline state handling
- Message persistence across page navigation
- Integration with user authentication for personalized responses

## Testing

### Automated Tests
A test script (`test-chat.mjs`) validates:
- Chat button visibility on home page
- Chat window opening functionality
- Chat window closing functionality
- Chat button presence on login page
- Chat button presence on agents page

### Manual Testing Checklist
- [ ] Button visible on all pages
- [ ] Click button opens chat window
- [ ] Click X closes chat window
- [ ] Iframe loads correctly
- [ ] Responsive on mobile devices
- [ ] No layout conflicts with other UI elements
- [ ] Proper z-index layering

## Troubleshooting

### Common Issues

**Chat button not visible:**
- Check that the Providers component is properly imported in layout.tsx
- Verify z-index conflicts with other elements

**Iframe not loading:**
- Check network connectivity to n8n.pavlin.dev
- Verify the webhook URL is correct and active
- Check browser console for CORS or iframe policy errors

**Mobile responsiveness issues:**
- Clear browser cache
- Test on actual mobile devices, not just browser dev tools
- Check viewport meta tags in the layout

## Maintenance

### Regular Checks
- Monitor n8n webhook uptime
- Review chat analytics and usage patterns
- Update iframe URL if webhook changes
- Test across different browsers and devices

### Dependencies
- React state management (useState)
- lucide-react icons (MessageSquare, X)
- Tailwind CSS for styling
- Next.js client components

---

**Last Updated**: 2026-02-13
**Version**: 1.0.0
**Component Location**: `/app/components/GlobalChat.tsx`
