import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { Toaster } from 'sonner';
import { ProtectedRoute, PublicRoute } from './Components/Routes/ProtectedRoutes.tsx';
import MainLayout from './Components/Layouts/MainLayout/MainLayout.tsx';
import LoginPage from './Pages/LoginPage/LoginPage.tsx';
import RegisterPage from './Pages/RegisterPage/RegisterPage.tsx';

function App() {

  return (
    <>
      <Toaster 
        position="top-right" 
        richColors 
        theme="dark" 
        closeButton 
      />

      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register-page" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
