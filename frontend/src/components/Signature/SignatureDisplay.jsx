import { useState, useEffect } from 'react';
import { signaturesAPI } from '../../services/api';

const SignatureDisplay = ({ signatureId }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const response = await signaturesAPI.getImage(signatureId);
        const blob = new Blob([response.data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error('Failed to load signature:', err);
      } finally {
        setLoading(false);
      }
    };

    if (signatureId) {
      fetchSignature();
    }
  }, [signatureId]);

  if (loading) {
    return <div style={styles.loading}>Loading signature...</div>;
  }

  if (!imageUrl) {
    return <div style={styles.error}>Signature not found</div>;
  }

  return (
    <div style={styles.container}>
      <img src={imageUrl} alt="Signature" style={styles.image} />
    </div>
  );
};

const styles = {
  container: {
    display: 'inline-block',
    padding: '0.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    backgroundColor: '#fff'
  },
  image: {
    maxWidth: '200px',
    maxHeight: '100px',
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  loading: {
    padding: '1rem',
    textAlign: 'center',
    color: '#666'
  },
  error: {
    padding: '1rem',
    textAlign: 'center',
    color: '#c33'
  }
};

export default SignatureDisplay;
