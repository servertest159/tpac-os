# TPAC OS - Developer Notes

## Overview

TPAC OS is a comprehensive programme management system designed for field operations coordination. The system handles event planning, gear inventory, participant management, itinerary scheduling, and after-action reporting for organizational programmes.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling with custom design tokens
- **shadcn/ui** component library
- **date-fns** for date handling
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend
- **Supabase** (PostgreSQL database)
- **Row Level Security (RLS)** for data access control
- **Edge Functions** for serverless backend logic
- **Supabase Auth** for authentication
- **Supabase Storage** for file uploads (gear photos, documents)

## Core Features

### 1. Programme Management
- Create, edit, and delete programmes (events)
- Track programme status: `active`, `aborted`, `upcoming`, `completed`
- Multi-day programme support with start and end dates
- Location and description tracking
- Participant capacity management
- Real-time updates via Supabase subscriptions

### 2. Gear Inventory System
- Comprehensive gear tracking with photos
- Quantity and availability management
- Condition monitoring and maintenance scheduling
- Type categorization
- Gear assignment to specific programmes
- Conflict detection for overlapping programme dates

### 3. Participant Management
- Invitation system with status tracking (`pending`, `accepted`, `declined`)
- Manual participant entry for non-system users
- Role-based participant requirements
- Profile management with contact information

### 4. Itinerary Planning
- Day-by-day activity scheduling
- Time, location, and activity details
- Linked to specific programmes

### 5. Emergency Contacts
- Programme-specific emergency contact records
- Type categorization (medical, local authority, etc.)
- Contact number storage

### 6. After-Action Reports (AAR)
- Feedback collection post-programme
- Rating system
- Comments and observations

### 7. Role-Based Access Control
- User roles: President, Vice-President, Secretary, Treasurer, Training Heads, Quartermaster, Publicity Heads, Member
- Role requirements per programme
- Admin-only features (gear management, user management)

## Architecture

### Database Schema

#### Core Tables
- **events** - Programme records with dates, location, status
- **profiles** - User information extending Supabase auth
- **user_roles** - Role assignments for RBAC
- **gear** - Inventory items with quantities and conditions
- **gear_events** - Junction table for gear-to-programme assignments
- **event_invitations** - Participant invitation tracking
- **event_role_requirements** - Required roles per programme
- **itinerary_items** - Day-by-day programme schedules
- **emergency_contacts** - Programme emergency contacts
- **trip_participants** - Manual participant entries
- **trip_gear_items** - Gear assignment tracking
- **trip_documents** - Document attachments

#### Security Tables
- **clearances** - Security clearance tracking
- **clearance_documents** - Clearance documentation
- **clearances_audit_log** - Audit trail for clearance access
- **profiles_audit_log** - Audit trail for profile access
- **relief_contacts_audit_log** - Audit trail for relief contact access

### Row Level Security (RLS) Policies

#### Events Table
- Public read access for all events
- Users can create events (auto-assigned as creator)
- Only event creators can update their events
- All authenticated users can delete events

#### Gear Table
- Public read access
- Admins only for create/update/delete operations
- Uses `has_role()` function for permission checks

#### Invitations Table
- Users can only view and update their own invitations
- No direct insert/delete (managed via edge functions or admin)

#### Profiles Table
- Users can view and update their own profiles
- Admins (President/Vice-President) can view all profiles
- Profile access logged for audit purposes

### Database Functions

- **has_role(user_id, role)** - Check if user has specific role
- **log_profile_access()** - Audit profile views by non-owners
- **log_clearance_access()** - Audit clearance data access
- **update_updated_at_column()** - Trigger for timestamp updates
- **get_upcoming_trips_with_stats()** - Aggregated upcoming programme data
- **get_past_trips_with_stats()** - Aggregated past programme data

## Key Patterns

### Real-time Updates
The system uses Supabase real-time subscriptions for live data updates:
```typescript
supabase
  .channel('schema-db-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'events'
  }, () => refetch())
  .subscribe()
```

### Optimistic UI Updates
Delete operations use optimistic updates for immediate feedback:
- Add ID to `deletingIds` set immediately
- Filter UI list to hide item
- On error, rollback by removing from set
- On success, refetch to confirm deletion

### Error Handling
Foreign key constraint violations (error code `23503`) are detected and provide user-friendly messages directing users to remove dependent records first.

### Design System
- Uses HSL color tokens defined in `index.css`
- Semantic tokens: `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- All components use design system tokens via Tailwind config
- No hardcoded colors (e.g., avoid `text-white`, use `text-foreground`)

## Authentication Flow

1. User signs in via Supabase Auth
2. Profile created/updated in `profiles` table
3. Roles assigned in `user_roles` table
4. RLS policies check `auth.uid()` and roles for data access
5. Admin functions use `has_role()` for permission checks

## Storage Buckets

- **gear-uploads** (public) - Gear inventory photos
- **clearance-documents** (private) - Security clearance files
- **media** (private) - General media attachments

## Edge Functions

- **create-event** - Handles event creation with validation
- **update-event** - Handles event updates with validation

## Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Configure Supabase credentials in `.env`
4. Run dev server: `npm run dev`
5. Access at `http://localhost:5173`

### Environment Variables
```
SUPABASE_URL=https://cfxecxtkwgbfeqeichij.supabase.co
SUPABASE_ANON_KEY=[anon-key]
```

## Known Considerations

### Delete Cascades
Deleting programmes with related records (gear assignments, itinerary, contacts) will fail due to foreign key constraints. Users must remove dependent records first, or cascade deletes must be added to the schema.

### File Size Considerations
- `EventDetail.tsx` (245 lines) - Consider splitting into smaller components
- `EventList.tsx` (288 lines) - Consider extracting EventCard component

### Performance
- Real-time subscriptions on multiple tables may impact performance at scale
- Consider debouncing refetch calls
- Implement pagination for large event lists

### Security
- Audit logs track sensitive data access (profiles, clearances)
- Bulk access detection functions available for anomaly monitoring
- Admin access to clearances requires enhanced validation via `can_access_sensitive_clearance_data()`

## Future Enhancements

- Soft delete / archive functionality
- Undo after delete feature
- Bulk operations (delete multiple programmes)
- Advanced search and filtering
- Export functionality (PDF, CSV)
- Calendar view for programmes
- Mobile app version
- Push notifications for invitations
- Gear maintenance reminders
- Analytics dashboard

## Code Style Guidelines

- Use TypeScript for type safety
- Follow functional React patterns (hooks, not classes)
- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Use semantic HTML elements
- Maintain consistent naming: camelCase for functions, PascalCase for components
- Prefer composition over prop drilling
- Use proper error boundaries

## Testing Strategy

- Manual testing in preview environment
- Check console logs for errors
- Verify network requests in DevTools
- Test RLS policies with different user roles
- Validate real-time updates across multiple sessions

## Deployment

- Frontend auto-deploys via Lovable hosting
- Edge functions auto-deploy on save
- Database migrations require manual approval
- No CI/CD pipeline currently configured

---

**Last Updated:** 2025-01-19
**Maintainer:** TPAC Development Team
**System Status:** Production Ready
