import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="site-header">
      <h1 className="site-title">
        <Link to="/">The Chronicles of Melody's Tempest</Link>
      </h1>
      <nav className="main-nav">
        <span>Ethiul</span>
        <span className="nav-separator">✦</span>
        <span>Morgan</span>
        <span className="nav-separator">✦</span>
        <span>Tassarion</span>
        <span className="nav-separator">✦</span>
        <span>Selene</span>
        <span className="nav-separator">✦</span>
        <span>Voroth</span>
      </nav>
    </header>
  );
};
