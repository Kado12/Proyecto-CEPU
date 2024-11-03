import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function VerifyEmail() {
  const [status, setStatus] = useState('Verificando...');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/verify/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setStatus('¡Email verificado exitosamente! Redirigiendo...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus(`Error: ${err.message}`);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-content">
        <h2>Verificación de Email</h2>
        <p>{status}</p>
      </div>
    </div>
  );
}

export default VerifyEmail;