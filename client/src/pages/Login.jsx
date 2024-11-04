import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      localStorage.setItem('token', data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className='login-body'>
      <img src="./fondo_uni.jpg" alt="Imagen de fondo" />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Iniciar Sesión</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Iniciar Sesión</button>
          <p>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
          <p>
            ¿Olvidaste tu contraseña? <Link to="/forgot-password">Recupérala aquí</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default Login;