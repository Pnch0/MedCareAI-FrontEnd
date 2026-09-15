import {Outlet} from 'react-router-dom';
import './MainLayout.css';

function MainLayout(){

    return(
        <>
        <div className="Main-Layout">

            <main className='Content'>
            <Outlet />
            </main>
        </div>
        </>
    )
}

export default MainLayout;