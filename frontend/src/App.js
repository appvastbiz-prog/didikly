import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthTest from './pages/AuthTest'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h1>Welcome to Didikly</h1>
              <p>UTeM Language Learning Platform</p>
              <a href="/auth-test" style={{ 
                display: 'inline-block', 
                padding: '10px 20px', 
                background: '#4CAF50', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '5px',
                marginTop: '20px'
              }}>
                Go to Auth Test
              </a>
            </div>
          } />
          <Route path="/auth-test" element={<AuthTest />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App