import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Home } from './pages/Home'
import { Feed } from './pages/Feed'
import { Report } from './pages/Report'
import { MyReports } from './pages/MyReports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="feed" element={<Feed />} />
          <Route path="report" element={<Report />} />
          <Route path="my-reports" element={<MyReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
