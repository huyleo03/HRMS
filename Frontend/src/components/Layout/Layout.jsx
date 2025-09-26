import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="content-area">
                <Header />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;