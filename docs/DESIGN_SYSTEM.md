# PawPop Design System

This document serves as the central reference for the PawPop design system, built with Tailwind CSS and DaisyUI. It outlines the design tokens, components, and patterns used throughout the application.

## Table of Contents
- [Theme](#theme)
- [Colors](#colors)
- [Typography](#typography)
- [Layout](#layout)
- [Components](#components)
- [Forms](#forms)
- [Navigation](#navigation)
- [Feedback](#feedback)
- [Best Practices](#best-practices)

## Theme

Our application uses a custom DaisyUI theme called `pawpop` defined in `tailwind.config.ts`. The theme includes:

- Primary color: Green (`#22c55e`)
- Secondary color: Darker green (`#16a34a`)
- Accent color: Light green (`#4ade80`)
- Neutral colors for text and backgrounds
- Rounded corners and consistent spacing

## Colors

### Primary Colors
- `bg-primary`: Main brand color
- `bg-primary-focus`: Hover/active state
- `text-primary`: Text on primary background
- `text-primary-content`: Text color that contrasts with primary

### Neutral Colors
- `bg-base-100`: Light background
- `bg-base-200`: Slightly darker background
- `text-base-content`: Main text color
- `text-base-content/70`: Secondary text (70% opacity)

### Semantic Colors
- `success`: Green for success states
- `warning`: Yellow for warnings
- `error`: Red for errors
- `info`: Blue for information

## Typography

### Font Family
- Using Inter font family (loaded via Next.js)
- Defined in `layout.tsx`

### Text Sizes
- Headings: `text-4xl` to `text-6xl`
- Subheadings: `text-2xl` to `text-3xl`
- Body: `text-base` (16px)
- Small text: `text-sm` (14px)

## Layout

### Container
```tsx
<div className="container mx-auto px-6">
  {/* Content */}
</div>
```

### Grid System
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

### Spacing
- Use Tailwind's spacing scale (0.25rem increments)
- Common spacings: `p-4`, `py-8`, `mt-6`, `mb-12`
- Max-width containers: `max-w-4xl mx-auto`

## Components

### Buttons
```tsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-outline">Outline Button</button>
<button className="btn btn-ghost">Ghost Button</button>
```

### Cards
```tsx
<div className="card bg-base-100 shadow-xl">
  <figure>
    <img src="image.jpg" alt="Card image" />
  </figure>
  <div className="card-body">
    <h3 className="card-title">Card Title</h3>
    <p>Card description</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### Alerts
```tsx
<div className="alert alert-info">
  <div>
    <span>Info alert</span>
  </div>
</div>

<div className="alert alert-success">
  <div>
    <span>Success alert</span>
  </div>
</div>

<div className="alert alert-error">
  <div>
    <span>Error alert</span>
  </div>
</div>
```

## Forms

### Input Fields
```tsx
<div className="form-control">
  <label className="label">
    <span className="label-text">Email</span>
  </label>
  <input 
    type="email" 
    placeholder="your@email.com" 
    className="input input-bordered w-full"
  />
</div>
```

### Select
```tsx
<select className="select select-bordered w-full">
  <option disabled selected>Pick one</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Checkbox & Radio
```tsx
<label className="label cursor-pointer">
  <span className="label-text">Remember me</span>
  <input type="checkbox" className="checkbox checkbox-primary" />
</label>

<label className="label cursor-pointer">
  <span className="label-text">Option 1</span>
  <input type="radio" name="radio-1" className="radio radio-primary" />
</label>
```

## Navigation

### Navbar
```tsx
<header className="navbar bg-base-100 shadow-lg">
  <div className="navbar-start">
    <Link href="/" className="btn btn-ghost text-xl">
      PawPop
    </Link>
  </div>
  <div className="navbar-end">
    <ul className="menu menu-horizontal px-1">
      <li><Link href="/about">About</Link></li>
      <li><Link href="/contact">Contact</Link></li>
    </ul>
  </div>
</header>
```

## Feedback

### Loading States
```tsx
// Button loading
<button className="btn btn-primary loading">Loading</button>

// Page loading
<div className="flex justify-center p-10">
  <span className="loading loading-spinner loading-lg"></span>
</div>
```

### Toasts
```tsx
// Use DaisyUI toast component
<div className="toast">
  <div className="alert alert-success">
    <span>Successfully saved!</span>
  </div>
</div>
```

## Best Practices

1. **Component Composition**
   - Break down UI into reusable components
   - Keep components focused and single-responsibility

2. **Responsive Design**
   - Use responsive prefixes (e.g., `md:`, `lg:`) for responsive behavior
   - Test on multiple screen sizes

3. **Accessibility**
   - Use semantic HTML elements
   - Include proper ARIA attributes
   - Ensure sufficient color contrast

4. **Performance**
   - Use `next/image` for optimized images
   - Lazy load non-critical components
   - Minimize bundle size by importing only needed components

5. **Theming**
   - Use theme variables from `tailwind.config.ts`
   - Avoid hardcoded colors in components
   - Extend the theme rather than overriding it

## Adding New Pages

1. Create a new file in `app` directory (e.g., `app/about/page.tsx`)
2. Use the layout pattern for shared UI elements
3. Follow the component structure from existing pages
4. Add any new components to the appropriate directory in `components/`

## Customization

To modify the theme, update the `tailwind.config.ts` file. For example:

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      // Add or override colors
    },
  },
},
```

## Resources

- [DaisyUI Documentation](https://daisyui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

This document should be updated whenever new patterns or components are added to the project to maintain consistency across the codebase.
