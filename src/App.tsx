import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { Toaster } from 'sonner';
import { ProtectedRoute, PublicRoute, RoleRoute } from './Components/Routes/ProtectedRoutes.tsx';
import MainLayout from './Components/Layouts/MainLayout/MainLayout.tsx';
import LoginPage from './Pages/LoginPage/LoginPage.tsx';
import RegisterPage from './Pages/RegisterPage/RegisterPage.tsx';
import MainPage from './Pages/Pacientes/MainPage.tsx';

{/* IMPORTACION VISTA MEDICO */}
import HomePageMedico from './Pages/Medicos/HomePage/HomePage.tsx';
import AgendaPageMedico from './Pages/Medicos/Agenda/AgendaPage.tsx';
import ResumenPageMedico from './Pages/Medicos/Resumen/ResumenPage.tsx';
import GestionCitasMedico from './Pages/Medicos/GestionCitas/GestionCitas.tsx';

import HomePageRecepcionista from './Pages/Recepcionista/HomePage/HomePage.tsx';

{/* IMPORTACION VISTA AMDINISTRADOR */}
import HomePageAdministrador from './Pages/Administrador/HomePage/HomePage.tsx';
import GestionUsuariosAdministrador from './Pages/Administrador/GestionUsuarios/GestionUsuarios.tsx';


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
            <Route path="/main-page-paciente" element={<MainPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
            {/* VISTAS MEDICO */}
            <Route element={<RoleRoute role="medico" />}>
              <Route path="/home-page-medico" element={<HomePageMedico />} />
              <Route path="/agenda-page-medico" element={<AgendaPageMedico />} />
              <Route path="/resumen-page-medico" element={<ResumenPageMedico />} />
              <Route path="/gestion-citas-page-medico" element={<GestionCitasMedico />} />
            </Route>

            {/* VISTAS RECEPCIONISTA */}
            <Route element={<RoleRoute role="recepcionista" />}>
              <Route path="/home-page-recepcionista" element={<HomePageRecepcionista />} />
            </Route>

            {/* VISTAS ADMINISTRADOR */}
            <Route element={<RoleRoute role="administrador" />}>
              <Route path="/home-page-administrador" element={<HomePageAdministrador />} />
              <Route path="/gestion-usuarios-page-administrador" element={<GestionUsuariosAdministrador />} />
            </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
