import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  noFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noFooter = false }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
};

export default Layout;
