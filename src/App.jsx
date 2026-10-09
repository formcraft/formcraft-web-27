import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './pages/Home'
import { Blog } from './pages/Blog'
import { Portfolio } from './pages/Portfolio'
import { CraftPage } from './pages/Shop'
import { Services } from './pages/Services'
import { AboutUs } from './pages/AboutUs'
import { Header } from './components/Header'

// Pages render straight away; only the parts that need the signed-in user
// wait for Firebase (see useAuth().loading).
function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/shop" element={<CraftPage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
