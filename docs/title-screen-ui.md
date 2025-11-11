# Title Screen UI - Visual Description

## Layout

The title screen features a centered vertical layout with:

### 1. Logo Section (Top)
- **Position**: Centered at top third of screen
- **Logo**: "DENSITY DWARF" SVG logo (400x200px)
- **Background**: Linear gradient from #1e3c72 to #2a5298 (blue gradient)
- **Effect**: Drop shadow for depth

### 2. Authentication Status (Middle)
Dynamic section showing one of three states:

#### State 1: Loading (Default on page load)
```
┌─────────────────────┐
│   ⟳ (spinner)       │
│  Authenticating...   │
└─────────────────────┘
```
- Animated spinner (white border, rotating)
- "Authenticating..." text

#### State 2: Success
```
┌─────────────────────┐
│ ✓ Authentication     │
│   successful!        │
│                      │
│ ID: xeYlCx2lfq...   │
└─────────────────────┘
```
- Green checkmark
- Success message
- User fingerprint (40 chars, monospace)

#### State 3: Error
```
┌─────────────────────┐
│ ✗ Authentication     │
│   failed             │
│                      │
│ Error: [message]     │
│  ┌──────────┐       │
│  │  Retry   │       │
│  └──────────┘       │
└─────────────────────┘
```
- Red X icon
- Error message
- Retry button

### 3. Continue Button (Bottom)
```
┌──────────────────────────┐
│   Continue to Game   →   │
└──────────────────────────┘
```
- Large green button (#4CAF50)
- Only visible after successful auth
- Auto-redirects to /sync after 2 seconds

## Color Scheme
- **Background**: Linear gradient (135deg, #1e3c72 → #2a5298)
- **Text**: White (#FFFFFF)
- **Primary Button**: Green (#4CAF50)
- **Error Text**: Light red (#FFCCCC)
- **Fingerprint**: Monospace, 80% opacity

## Responsive Behavior
- Logo scales to fit viewport (max 400px)
- Padding: 2rem on all sides
- Minimum height: 100vh (fullscreen)
- Vertical centering via flexbox

## Animation & Transitions
- Spinner: Continuous 1s linear rotation
- Button hover: Scale 1.05, translateY(-2px)
- State transitions: Instant (hide/show with CSS classes)
- Auto-redirect: 2 second delay after success

## Security Indicators
- Fingerprint display shows user ID
- No passwords or personal info required
- Visual feedback for each auth step
