import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">X</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-800 hidden sm:inline">Xavier's NMMS Scanner</span>
              <span className="text-lg sm:text-xl font-bold text-slate-800 sm:hidden">NMMS Scanner</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/scanner"
                className="text-slate-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Scanner
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-slate-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/results"
                className="text-slate-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Results
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600 hidden lg:inline">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-700 hover:text-primary-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col space-y-2">
              <Link
                to="/scanner"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Scanner
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/results"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Results
              </Link>
              <div className="px-3 py-2 border-t border-slate-200 mt-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

