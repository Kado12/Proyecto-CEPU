import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar el perfil');
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!userData) return <div>Cargando...</div>;

  return (
    <div className="profile-container">
      <h2>Perfil de Usuario</h2>
      <div className="profile-info">
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Fecha de registro:</strong> {new Date(userData.created_at).toLocaleDateString()}</p>
      </div>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
}

export default Profile;