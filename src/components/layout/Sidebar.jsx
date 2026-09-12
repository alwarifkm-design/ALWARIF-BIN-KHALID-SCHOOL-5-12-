import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home, Users, BookOpen, GraduationCap,
  BookMarked, Calendar, ShieldAlert, FileText, Settings
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { cn } from '../../lib/utils.js'

const navItems = [
  { to: '/',              icon: Home,        key: 'home',          exact: true },
  { to: '/students',      icon: Users,       key: 'students' },
  { to: '/sections',      icon: BookOpen,    key: 'sections' },
  { to: '/teachers',      icon: GraduationCap, key: 'teachers' },
  { to: '/subjects',      icon: BookMarked,  key: 'subjects' },
  { to: '/timetable',     icon: Calendar,    key: 'timetable' },
  { to: '/violations',    icon: ShieldAlert, key: 'violations' },
  { to: '/subject-forms', icon: FileText,    key: 'subject_forms' },
  { to: '/settings',      icon: Settings,    key: 'settings' },
]

export default function Sidebar() {
  const { t } = useLanguage()

  return (
    <aside className="no-print hidden md:flex flex-col w-60 flex-shrink-0 bg-card border-e border-border h-full">
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, key, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
