
import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Balance-Feed Logo" className="h-8 w-auto" />
                <span className="text-2xl font-bold text-gray-800 tracking-tight">Balance</span>
            </div>
            <h1 className="text-xl font-medium text-gray-500">{title}</h1>
        </div>
    </header>
  );
};

export default Header;
