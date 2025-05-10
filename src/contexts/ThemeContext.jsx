import { createContext, useState, useContext, useEffect } from 'react';

// Create a context for theme
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if theme is stored in localStorage, default to 'cyberpunk'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('retroBoardTheme');
    return savedTheme || 'classic';
  });

  // Apply theme to body when it changes
  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('retroBoardTheme', theme);
    
    // Apply theme class to body
    if (theme === 'classic') {
      document.body.classList.add('theme-classic');
    } else {
      document.body.classList.remove('theme-classic');
    }
  }, [theme]);

  // Toggle between themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'cyberpunk' ? 'classic' : 'cyberpunk');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
