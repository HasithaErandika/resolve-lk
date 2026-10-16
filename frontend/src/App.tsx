import { Routes, Route, useNavigate } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Home } from './pages/Home'
import { Report } from './pages/Report'
import { Feed } from './pages/Feed'
import { MyReports } from './pages/MyReports'
import { CouncilDirectory } from './pages/CouncilDirectory'
import { OfficerAuthProvider } from './context/OfficerAuthContext'
import { OfficerPortal } from './components/officer/OfficerPortal'

function OfficerRoute() {
  const navigate = useNavigate()
  return <OfficerPortal onBackToPublic={() => navigate('/')} />
}

export default function App() {
  return (
    <OfficerAuthProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/councils" element={<CouncilDirectory />} />
        </Route>
        <Route path="/officer/*" element={<OfficerRoute />} />
      </Routes>
    </OfficerAuthProvider>
  )
}
