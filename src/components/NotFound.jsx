import { Link } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const NotFound = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="not-found">
      <div className="not-found-header">
        <h1>404 - Page Not Found</h1>
        <button onClick={toggleTheme} className="theme-toggle-button">
          {theme === 'cyberpunk' ? <FaSun /> : <FaMoon />}
          {theme === 'cyberpunk' ? 'Classic Theme' : 'Cyberpunk Theme'}
        </button>
      </div>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="home-link">Go to Home</Link>
    </div>
  );
};

export default NotFound;
