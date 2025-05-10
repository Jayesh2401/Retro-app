import { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth, signInWithGoogle, loginWithEmail, registerWithEmail, resetPassword } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaUser, FaLock, FaUserPlus, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const Login = () => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  // eslint-disable-next-line no-unused-vars
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAnonymousLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymously(auth);
      // Redirect will happen automatically via the App.jsx route protection
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // Redirect will happen automatically via the App.jsx route protection
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      if (isLogin) {
        // Login with email
        await loginWithEmail(formData.email, formData.password);
      } else {
        // Register with email
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (!formData.displayName.trim()) {
          throw new Error('Display name is required');
        }

        await registerWithEmail(formData.email, formData.password, formData.displayName);
      }

      // Redirect will happen automatically via the App.jsx route protection
    } catch (error) {
      console.error('Error with email auth:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(false);

    if (!resetEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const toggleResetPassword = () => {
    setShowResetPassword(!showResetPassword);
    setError(null);
    setResetSuccess(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div>
            <h1>Retro Board</h1>
          </div>
          <button onClick={toggleTheme} className="theme-toggle-button login-theme-toggle">
            {theme === 'cyberpunk' ? <FaSun /> : <FaMoon />}
          </button>
        </div>
            <p>A collaborative tool for team retrospectives</p>

        {showResetPassword ? (
          <div className="reset-password-form">
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email</label>
                <div className="input-with-icon">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {resetSuccess && (
                <p className="success-message">
                  Password reset email sent! Check your inbox.
                </p>
              )}

              <button
                type="button"
                className="toggle-auth-button"
                onClick={toggleResetPassword}
              >
                Back to Login
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="social-login">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="google-button"
              >
                <FaGoogle /> Continue with Google
              </button>

              {/* <div className="divider">
                <span>or</span>
              </div> */}
            </div>

            {/* <form onSubmit={handleEmailAuth} className="email-auth-form">
              <h2>{isLogin ? 'Login' : 'Create Account'}</h2>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <div className="input-with-icon">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-with-icon">
                    <FaLock className="input-icon" />
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
              </button>

              {isLogin && (
                <button
                  type="button"
                  className="forgot-password-button"
                  onClick={toggleResetPassword}
                >
                  Forgot Password?
                </button>
              )}

              <button
                type="button"
                className="toggle-auth-button"
                onClick={toggleAuthMode}
              >
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
              </button>
            </form> */}

            <div className="anonymous-login">
              <div className="divider">
                <span>or</span>
              </div>

              <button
                onClick={handleAnonymousLogin}
                disabled={loading}
                className="anonymous-button"
              >
                <FaUserPlus /> Continue Anonymously
              </button>
            </div>
          </>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
