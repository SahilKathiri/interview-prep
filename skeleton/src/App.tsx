import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CompanyPage from './pages/CompanyPage'
import ChallengePage from './pages/ChallengePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/:company" element={<CompanyPage />} />
      <Route path="/:company/:folder" element={<ChallengePage />} />
    </Routes>
  )
}
