import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Récupère les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (type === 'signup' && access_token && refresh_token) {
      // Valide le token auprès de Supabase
      supabase.auth.setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            setStatus('error');
            setMessage("Erreur lors de la confirmation de l'email. Le lien est peut-être expiré ou déjà utilisé.");
          } else {
            setStatus('success');
            setMessage('Votre email a bien été confirmé ! Vous pouvez maintenant accéder à votre compte.');
            setTimeout(() => navigate('/'), 4000);
          }
        });
    } else {
      setStatus('error');
      setMessage('Lien de confirmation invalide ou incomplet.');
    }
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'pending' && <LoadingSpinner size="lg" text="Confirmation en cours..." />}
        {status === 'success' && (
          <>
            <div className="text-green-600 text-2xl font-bold mb-4">Confirmation réussie</div>
            <div className="text-gray-700 mb-2">{message}</div>
            <div className="text-sm text-gray-500">Redirection automatique...</div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-600 text-2xl font-bold mb-4">Erreur</div>
            <div className="text-gray-700 mb-2">{message}</div>
            <a href="/" className="text-blue-600 hover:underline">Retour à l'accueil</a>
          </>
        )}
      </div>
    </div>
  );
};

export default Confirmation; 
