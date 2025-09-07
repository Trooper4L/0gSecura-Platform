'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Laptop, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { name: 'Light', value: 'light', icon: Sun },
    { name: 'Dark', value: 'dark', icon: Moon },
    { name: 'System', value: 'system', icon: Laptop },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {themes.map((item) => (
        <button
          key={item.value}
          onClick={() => setTheme(item.value)}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
            theme === item.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
              : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
          )}
        >
          <item.icon className="h-6 w-6" />
          <span className="text-sm font-medium">{item.name}</span>
        </button>
      ))}
    </div>
  )
}