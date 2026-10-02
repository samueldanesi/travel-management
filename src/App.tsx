import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ClienteDetail from './pages/ClienteDetail'
import Clienti from './pages/Clienti'
import Dashboard from './pages/Dashboard'
import Marketing from './pages/Marketing'
import PraticaDetail from './pages/PraticaDetail'
import Pratiche from './pages/Pratiche'
import Scadenzario from './pages/Scadenzario'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pratiche" element={<Pratiche />} />
        <Route path="pratiche/:id" element={<PraticaDetail />} />
        <Route path="scadenzario" element={<Scadenzario />} />
        <Route path="clienti" element={<Clienti />} />
        <Route path="clienti/:id" element={<ClienteDetail />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
