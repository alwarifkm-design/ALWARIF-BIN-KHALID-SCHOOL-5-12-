import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, Calendar, ShieldAlert, Settings } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { cn } from '../../lib/utils.js'

const bottomItems = [
  { to: '/',           icon: Home,        key: 'home',       exact: true },
  { to: '/students',   icon: Users,       key: 'students' },
  { to: '/timetable',  icon: Calendar,    key: 'timetable' },
  { to: '/violations', icon: ShieldAlert, key: 'violations' },
  { to: '/settings',   icon: Settings,    key: 'settings' },
]

export default function BottomNav() {
  const { t } = useLanguage()

  return (
    <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-card border-t border-border flex items-center justify-around px-2">
      {bottomItems.map(({ to, icon: Icon, key, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors flex-1',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="truncate">{t(`nav.${key}`)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
