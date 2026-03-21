# Task: Improve /dashboard/advisor/create-group to popup card form like announcements/schedule (without missing content)

**Current analysis**:
- Route: src/app/dashboard/advisor/create-group/page.tsx → AdvisorCreateGroupPage component
- Form: Rich - Name*, Project*, Description, Privacy select, Members search/checkbox list (project filtered, select all), Preview, localStorage persistence, redirect to messages
- Entry: messages-page.tsx "Create New Group" button → /create-group

**Plan**:
- **Integrate popup Dialog** in messages-page.tsx (like announcements)
- Move ALL logic (mock data, storage, state, functions) to new CreateGroupForm component in DialogContent
- Preserve: 3-col grid (form + members list), search, checkboxes, preview, btn-gradient styling
- Responsive Dialog (max-w-6xl)

**Dependent Files**:
- `src/components/dashboard/advisor/messages-page.tsx`: Add Dialog, form component
- Keep create-group-page.tsx as-is (route fallback)

**Followup**:
- Test popup from messages page button
- Verify localStorage groups persist, preview shows, submit redirects

Ready to proceed?
