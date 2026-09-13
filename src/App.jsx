import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/shared/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

// Auth pages (eager — small and always needed)
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'

// App pages (lazy for faster initial load)
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const StudentsPage = lazy(() => import('./pages/StudentsPage.jsx'))
const SectionsPage = lazy(() => import('./pages/SectionsPage.jsx'))
const TeachersPage = lazy(() => import('./pages/TeachersPage.jsx'))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage.jsx'))
const TimetablePage = lazy(() => import('./pages/TimetablePage.jsx'))
const ViolationsPage = lazy(() => import('./pages/ViolationsPage.jsx'))
const SubjectFormsPage = lazy(() => import('./pages/SubjectFormsPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground font-cairo">جارٍ التحميل...</div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold font-cairo text-foreground">404</h1>
      <p className="text-muted-foreground">الصفحة غير موجودة</p>
      <a href="/" className="text-primary hover:underline text-sm">العودة للرئيسية</a>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <StudentsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/sections"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <SectionsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/teachers"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <TeachersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/subjects"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <SubjectsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/timetable"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <TimetablePage />
                    </Suspense>
                  }
                />
                <Route
                  path="/violations"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ViolationsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/subject-forms"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <SubjectFormsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Suspense fallback={<PageLoader />}>
                        <SettingsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}