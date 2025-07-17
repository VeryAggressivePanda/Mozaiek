import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

interface Memorial {
  id: string;
  name: string;
  description: string;
  photo_url: string;
  is_public: boolean;
  created_at: string;
  memories_count?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMemorials();
  }, []);

  const fetchMemorials = async () => {
    try {
      const response = await axios.get('/api/user/memorials');
      setMemorials(response.data.memorials);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch memorials');
    } finally {
      setLoading(false);
    }
  };

  const copyMemorialLink = (memorialId: string) => {
    const link = `${window.location.origin}/memorial/${memorialId}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
    alert('Memorial link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your memorials...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}</h1>
        <p>Manage your memorials and share them with loved ones</p>
        <Link to="/create-memorial" className="create-btn">
          Create New Memorial
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {memorials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🕊️</div>
          <h2>No memorials yet</h2>
          <p>Create your first memorial to honor a loved one</p>
          <Link to="/create-memorial" className="btn btn-primary">
            Create Your First Memorial
          </Link>
        </div>
      ) : (
        <div className="memorials-grid">
          {memorials.map((memorial) => (
            <div key={memorial.id} className="memorial-card">
              <div className="memorial-image">
                <img src={memorial.photo_url} alt={memorial.name} />
                <div className="memorial-overlay">
                  <Link to={`/memorial/${memorial.id}`} className="view-btn">
                    View Memorial
                  </Link>
                </div>
              </div>
              
              <div className="memorial-content">
                <h3>{memorial.name}</h3>
                <p>{memorial.description}</p>
                
                <div className="memorial-meta">
                  <span className={`status ${memorial.is_public ? 'public' : 'private'}`}>
                    {memorial.is_public ? 'Public' : 'Private'}
                  </span>
                  <span className="date">
                    Created {new Date(memorial.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="memorial-actions">
                  <button 
                    onClick={() => copyMemorialLink(memorial.id)}
                    className="share-btn"
                  >
                    Share Link
                  </button>
                  <Link 
                    to={`/memorial/${memorial.id}/add-memory`}
                    className="add-memory-btn"
                  >
                    Add Memory
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;