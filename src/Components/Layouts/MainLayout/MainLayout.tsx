import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.tsx';
import './MainLayout.css';

function MainLayout() {
    const userRole = localStorage.getItem('userRole') || 'paciente';

    return (
        <div className="Main-Layout">
            {userRole !== 'paciente' && <Navbar />}

            <main className='Content'>
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout;