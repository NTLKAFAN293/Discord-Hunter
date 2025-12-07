# Discord Username Checker - Design Guidelines

## Design Approach
**System Selected:** Material Design with dashboard patterns
**Justification:** Utility-focused tool requiring clear data visualization, real-time updates, and efficient information density. Arabic RTL support required.

## Typography
- **Primary Font:** Cairo (Google Fonts) - excellent Arabic support
- **Headings:** 2xl/3xl font-bold for main title, xl font-semibold for section headers
- **Body Text:** base/lg for primary content, sm for secondary info
- **Monospace:** JetBrains Mono for username display (Latin characters), font-mono for clarity
- **Direction:** RTL layout throughout (dir="rtl")

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 (p-4, gap-6, m-8)
- Container: max-w-6xl mx-auto px-4
- Sections: py-6 to py-8 spacing
- Card padding: p-6
- Grid gaps: gap-4 for tight grids, gap-6 for loose layouts

## Component Structure

### Header
- App title with icon (center or right-aligned for RTL)
- Real-time status indicator (نشط/متوقف with colored dot)
- Stats summary bar below header

### Control Panel (Top Section)
Two-column grid on desktop, stacked on mobile:
- **Right Column:** Generation settings (username length, pattern type, character options)
- **Left Column:** Rate limiting controls (delay slider, daily limit counter)
- Large start/stop button (full width, prominent)

### Results Display (Main Section)
Three-column layout:
1. **Queue Column:** Usernames being checked (with loading spinner)
2. **Available Column:** Green-tagged available usernames with copy button
3. **Unavailable Column:** Red-tagged taken usernames

On mobile: Single column with tabbed navigation

### Statistics Panel (Bottom Section)
Four-card grid (2x2 on mobile):
- Total checks performed
- Available usernames found
- Success rate percentage
- Time elapsed

### Export Section
- Download button for available usernames (CSV/TXT)
- Clear results button

## Visual Hierarchy
- Primary action (Start/Stop): Largest button, accent color
- Available usernames: Prominent with success color treatment
- Settings: Secondary visual weight
- Statistics: Tertiary, informational

## Micro-interactions
- Real-time number counting for statistics
- Smooth transitions when usernames move between columns
- Progress indicator during active checking
- Toast notifications for important events (rate limit warning, export success)

## Data Display Patterns
- Monospace font for all usernames
- Color coding: Green (available), Red (taken), Yellow (checking)
- Badges for username length (3L, 4L, ~3L)
- Copy-to-clipboard icon next to each available username

## Arabic-Specific Considerations
- Complete RTL layout
- Arabic numerals option
- Right-aligned form inputs
- Reversed progress bars and sliders
- Mirrored icons where directional

## Accessibility
- Clear focus states on all interactive elements
- ARIA labels for status indicators
- Screen reader announcements for username status changes
- Keyboard navigation for username list
- High contrast between text and backgrounds