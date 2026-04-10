import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-gray-800 border-b border-gray-700 p-4 shadow-lg flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick} 
          className="text-gray-100 hover:text-blue-400 focus:outline-none mr-4 transition-colors"
          title="Abrir menu de navegação lateral"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-blue-400 tracking-wider font-display">SKYNETchat</h1>
      </div>
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-tighter">Secure Link Active</span>
        </div>
      </div>
    </header>
  );
};

export default Header;