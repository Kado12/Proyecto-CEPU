import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TableStudent from '../components/TableStudent';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar el perfil');
        }

        const data = await response.json();
        setUserData(data.user);
        setStudentData(data.students);
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
  console.log(new Date(userData.created_at))
  console.log(userData.created_at)

  return (
    <>
      <main className='profile-body'>
        <div className="profile-container">
          <div className="profile-info">
            <h2>Perfil de Usuario</h2>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Fecha de registro:</strong> {new Date(userData.created_at).toLocaleDateString()}</p>
          </div>
          <div className="profile-actions">
            <Link to="/change-password" className="change-password-link">
              Cambiar Contraseña
            </Link>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </div>
        <div className='profile-register'>
          <TableStudent studentData={studentData} />
        </div>
      </main>

    </>
  );
}

export default Profile;