// app/providers.tsx
'use client'

export function Providers({ 
    children 
  }: { 
  children: React.ReactNode 
  }) {
  return (
    <div data-theme="pawpop">
      {children}
    </div>
  )
}
