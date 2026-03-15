import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CompanyPage from './pages/CompanyPage'
import ChallengePage from './pages/ChallengePage'
import KnowledgePage from './pages/KnowledgePage'
import KnowledgeSectionPage from './pages/KnowledgeSectionPage'
import KnowledgeChallengePage from './pages/KnowledgeChallengePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/knowledge" element={<KnowledgePage />} />
      <Route path="/knowledge/:section" element={<KnowledgeSectionPage />} />
      <Route path="/knowledge/:section/:folder" element={<KnowledgeChallengePage />} />
      <Route path="/:company" element={<CompanyPage />} />
      <Route path="/:company/:folder" element={<ChallengePage />} />
    </Routes>
  )
}
