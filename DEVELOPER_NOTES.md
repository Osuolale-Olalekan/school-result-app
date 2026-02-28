# School Results System - Developer Quick Reference

## Key Files & Their Purpose

### Core Logic
- **`/lib/auth-context.tsx`** - Authentication & user state management
- **`/lib/mock-data.ts`** - Type definitions & mock database
- **`/lib/promotion-utils.ts`** - Student promotion algorithms
- **`/lib/export-utils.ts`** - CSV/export functionality

### Pages (Features)
- **Admin Dashboard**: `/app/dashboard/admin/page.tsx`
- **Register Student**: `/app/dashboard/admin/register-student/page.tsx`
- **Register Teacher**: `/app/dashboard/admin/register-teacher/page.tsx`
- **Student Promotions**: `/app/dashboard/admin/promotions/page.tsx`
- **Teacher Dashboard**: `/app/dashboard/teacher/page.tsx`
- **Student Results**: `/app/dashboard/student/page.tsx`
- **Report Card**: `/app/dashboard/student/report-card/page.tsx`

### Components
- **`/components/dashboard-sidebar.tsx`** - Navigation with role-based menu
- **`/components/dashboard-header.tsx`** - Top header with user info & mobile menu
- **`/components/auth-guard.tsx`** - Route protection
- **`/components/ui/*`** - Shadcn UI components (pre-configured)

---

## Type Definitions Reference

### Main Types
```typescript
type UserRole = 'admin' | 'teacher' | 'student';
type StudentStatus = 'active' | 'inactive';
type TeacherStatus = 'active' | 'inactive';
type ResultStatus = 'pending' | 'approved' | 'rejected';
type PromotionStatus = 'promoted' | 'repeated' | 'pending';
type Term = 'term1' | 'term2' | 'term3';
```

### Key Interfaces
```typescript
// User
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Student with promotion support
interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  class: string;
  section: string;
  dateOfAdmission: string;
  status: StudentStatus;
  avatar: string;
  promotionStatus?: PromotionStatus;
}

// Teacher with class assignments
interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: TeacherStatus;
  avatar: string;
  assignedClasses: string[];
}

// Result with term tracking
interface Result {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  class: string;
  section: string;
  subject: string;
  term: Term;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
  uploadedBy: string;
  uploadedDate: string;
  status: ResultStatus;
  comments?: string;
}

// Promotion tracking
interface StudentPromotion {
  id: string;
  studentId: string;
  studentName: string;
  currentClass: string;
  currentSection: string;
  promotedToClass: string;
  promotionStatus: PromotionStatus;
  academicYear: string;
  manualPromotion: boolean;
  promotedBy?: string;
  promotionDate?: string;
}
```

---

## Utility Functions

### Promotion Utilities (`/lib/promotion-utils.ts`)

```typescript
// Calculate student's overall performance
calculateStudentPerformance(studentId: string, results: Result[])
  → { averagePercentage, passedAll, subjectResults }

// Check if student should auto-promote
shouldAutoPromote(studentId: string, results: Result[]) → boolean

// Get next class for promotion
getNextClass(currentClass: string) → string

// Generate promotion suggestions for all students
generatePromotionSuggestions(students: Student[], results: Result[]) 
  → Array<{ student, shouldPromote, nextClass, averagePercentage }>

// Get color for grade badges
getGradeColor(grade: string) → string

// Convert percentage to grade
percentageToGrade(percentage: number) → string
```

### Constants
```typescript
PASSING_PERCENTAGE = 40  // Minimum to pass
```

---

## Authentication Flow

```javascript
// Login (in auth-context.tsx)
1. User enters email, password, role
2. Mock validation (replace with Supabase Auth)
3. User object created and stored in localStorage
4. Redux/context state updated
5. useAuth() hook provides user data to components

// Protected Routes
1. AuthGuard component checks useAuth()
2. If not authenticated → redirect to /
3. If authenticated → allow access

// Teacher Filtering
1. Get user email from auth context
2. Find matching teacher record
3. Get assignedClasses array
4. Filter components/data by assignedClassIds
```

---

## Responsive Breakpoints

```tailwind
sm: 640px   - Small phones
md: 768px   - Tablets
lg: 1024px  - Desktops
xl: 1280px  - Large screens
```

### Usage Pattern
```jsx
{/* Shows on all, then hides on mobile */}
<div className="hidden md:flex">Desktop only</div>

{/* Grid that changes columns */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

{/* Text that changes size */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

---

## Database Integration Guide

### To Connect Supabase:

1. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Client** (`/lib/supabase.ts`)
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   );
   ```

3. **Replace Mock Data** in `promotion-utils.ts`:
   ```typescript
   // OLD: const results = MOCK_RESULTS;
   // NEW: const results = await supabase.from('results').select('*');
   ```

4. **Update Auth Context**:
   ```typescript
   // Use Supabase Auth instead of localStorage
   const { data: { user } } = await supabase.auth.signInWithPassword({
     email,
     password
   });
   ```

---

## Common Development Tasks

### Add New Role
1. Update `UserRole` type in `auth-context.tsx`
2. Add conditional in `getNavItems()` in `dashboard-sidebar.tsx`
3. Create role-specific pages in `/app/dashboard/{role}/`

### Add New Student Field
1. Update `Student` interface in `mock-data.ts`
2. Add form field in `register-student/page.tsx`
3. Update MOCK_STUDENTS with data

### Add New Report Type
1. Create page in `/app/dashboard/{role}/`
2. Add navigation link in `dashboard-sidebar.tsx`
3. Import data types and utilities needed

### Make Page Mobile-Friendly
```jsx
// Use responsive classes
<div className="p-4 md:p-8">
  <h1 className="text-2xl md:text-4xl">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
    {items.map(...)}
```

---

## Common Issues & Solutions

### Issue: Teacher sees all classes
**Solution**: Update `MOCK_TEACHERS` with correct `assignedClasses`

### Issue: Report card not downloading
**Solution**: Ensure student has approved results in `MOCK_RESULTS`

### Issue: Promotion not calculating
**Solution**: Check `PASSING_PERCENTAGE` constant and result `status === 'approved'`

### Issue: Form not responsive on mobile
**Solution**: Use `grid-cols-1 md:grid-cols-2` instead of fixed grid

### Issue: Table text overflowing on mobile
**Solution**: Add `hidden sm:table-cell` classes to extra columns

---

## Code Style Conventions

```typescript
// Naming
- Components: PascalCase (RegisterStudent)
- Functions: camelCase (calculateStudentPerformance)
- Types/Interfaces: PascalCase (Student, UserRole)
- Constants: UPPER_SNAKE_CASE (PASSING_PERCENTAGE)

// Imports
- Types at top: import type { ... }
- Components: import { ... } from '@/components'
- Utils: import { ... } from '@/lib'

// Exports
- Named exports for reusability
- Default exports for pages

// Comments
- Document complex logic
- Explain business rules
- Use TypeScript types instead of JSDoc
```

---

## Testing Features

### Test Admin Registration
```
1. Login as admin
2. Click "Register Student"
3. Fill form with test data
4. Submit
5. Check if success notification appears
```

### Test Teacher Filtering
```
1. Login as teacher (anjali@school.com)
2. Check dashboard shows only assigned classes
3. Verify other classes don't appear
4. Click upload results - should only show assigned class
```

### Test Promotion Logic
```
1. Check MOCK_RESULTS for student with >40% in all subjects
2. Go to Promotions page
3. Verify student appears in "Auto-Promote" section
4. Manually promote different student
5. Check promotion records updated
```

### Test Responsive Design
```
1. Open DevTools (F12)
2. Toggle Device Toolbar
3. Test: 375px (mobile), 768px (tablet), 1024px (desktop)
4. Verify sidebar hides/shows
5. Check tables scroll horizontally
6. Verify buttons are clickable
```

---

## Performance Tips

1. **Memoization**: Use `useMemo` for complex calculations
2. **Lazy Loading**: Code-split pages with dynamic imports
3. **Image Optimization**: Use Next.js `<Image>` component
4. **Caching**: Implement SWR for data fetching

---

## Debugging Tips

```typescript
// Log component renders
console.log("[v0] Component rendering:", props);

// Log state changes
console.log("[v0] State updated:", newState);

// Log async operations
console.log("[v0] API call started");
console.log("[v0] API response:", data);

// Log calculations
console.log("[v0] Promotion calc:", { averagePercentage, passedAll });
```

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript**: https://typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase**: https://supabase.com/docs

---

**Happy Coding! 🚀**
