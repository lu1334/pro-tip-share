import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { DailyDetailPage } from '../pages/DailyDetailPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { WeeklyGridPage } from '../pages/WeeklyGridPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard/weekly" replace />} />
        <Route path="dashboard/weekly" element={<WeeklyGridPage />} />
        <Route path="daily/:dailyTipId" element={<DailyDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
