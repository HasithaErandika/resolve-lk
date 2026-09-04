import { Routes, Route, useNavigate } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Home } from './pages/Home'
import { Report } from './pages/Report'
import { Feed } from './pages/Feed'
import { MyReports } from './pages/MyReports'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AdminPortal } from './components/admin/AdminPortal'

function AdminRoute() {
  const navigate = useNavigate()
  return <AdminPortal onBackToPublic={() => navigate('/')} />
}

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/my-reports" element={<MyReports />} />
        </Route>
        <Route path="/admin/*" element={<AdminRoute />} />
      </Routes>
    </AdminAuthProvider>
  )
}
