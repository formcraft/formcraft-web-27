import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Auth } from './components/auth'
import { Home } from './pages/Home'
import { Blog } from './pages/Blog'
import { Portfolio } from './pages/Portfolio'
import { CraftPage } from './pages/Shop'
import { Services } from './pages/Services'
import { AboutUs } from './pages/AboutUs'
import { Header } from './components/Header'
import { auth } from './config/firebase'
import { onAuthStateChanged } from 'firebase/auth'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const POPUP_DELAY = 2000 // 2 seconds in milliseconds

  useEffect(() => {
    let timer;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      
      // Clear any existing timer
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      
      // If user is authenticated, hide the auth modal
      if (currentUser) {
        setShowAuth(false)
      } else {
        // If not authenticated, start the timer for auth popup
        timer = setTimeout(() => {
          setShowAuth(true)
        }, POPUP_DELAY)
      }
    })

    return () => {
      unsubscribe()
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])

  // Show nothing while loading
  if (loading) {
    return null
  }

  return (
    <Router>
      <Header user={user} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/blog" element={<Blog user={user} />} />
        <Route path="/portfolio" element={<Portfolio user={user} />} />
        <Route path="/shop" element={<CraftPage user={user} />} />
        <Route path="/services" element={<Services user={user} />} />
        <Route path="/about" element={<AboutUs user={user} />} />
      </Routes>
      {showAuth && <Auth />}
    </Router>
  )
}

export default App
