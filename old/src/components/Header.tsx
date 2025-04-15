
import React from 'react';
import Logo from './Logo';

const Header: React.FC = () => {
  return (
    <header className="py-6 border-b">
      <div className="container mx-auto">
        <Logo size="medium" />
      </div>
    </header>
  );
};

export default Header;
