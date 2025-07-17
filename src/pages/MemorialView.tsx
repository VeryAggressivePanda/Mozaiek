import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './MemorialView.css';

interface Memory {
  id: string;
  visitor_name: string;
  message: string;
  photo_url: string;
  created_at: string;
  dominant_colors: Array<{ r: number; g: number; b: number }>;
}

interface Memorial {
  id: string;
  name: string;
  description: string;
  photo_url: string;
  is_public: boolean;
  created_at: string;
  users: { name: string };
  memories: Memory[];
}

const MemorialView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchMemorial = useCallback(async () => {
    try {
      const response = await axios.get(`/api/memorials/${id}`);
      setMemorial(response.data.memorial);
      
      // Check if memorial is private and we need password
      if (!response.data.memorial.is_public && !password) {
        setShowPasswordForm(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load memorial');
    } finally {
      setLoading(false);
    }
  }, [id, password]);

  useEffect(() => {
    fetchMemorial();
  }, [fetchMemorial]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    try {
      // Test password by trying to fetch memorial again
      const response = await axios.get(`/api/memorials/${id}`, {
        headers: {
          'X-Password': password
        }
      });
      setMemorial(response.data.memorial);
      setShowPasswordForm(false);
    } catch (err: any) {
      setPasswordError('Invalid password');
    }
  };

  const calculateMosaicOpacity = () => {
    if (!memorial || !memorial.memories) return 0;
    const totalMemories = memorial.memories.length;
    // Start revealing at 5 memories, fully revealed at 50 memories
    const minMemories = 5;
    const maxMemories = 50;
    const opacity = Math.min(1, Math.max(0, (totalMemories - minMemories) / (maxMemories - minMemories)));
    return opacity;
  };

  if (loading) {
    return (
      <div className="memorial-container">
        <div className="loading">Loading memorial...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="memorial-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="memorial-container">
        <div className="error-message">Memorial not found</div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="memorial-container">
        <div className="password-form">
          <h2>Private Memorial</h2>
          <p>This memorial is private. Please enter the password to view it.</p>
          
          {passwordError && <div className="error-message">{passwordError}</div>}
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              View Memorial
            </button>
          </form>
        </div>
      </div>
    );
  }

  const mosaicOpacity = calculateMosaicOpacity();

  return (
    <div className="memorial-container">
      <div className="memorial-header">
        <h1>{memorial.name}</h1>
        {memorial.description && <p className="memorial-description">{memorial.description}</p>}
        <p className="memorial-meta">
          Created by {memorial.users.name} • {memorial.memories.length} memories shared
        </p>
      </div>

      <div className="mosaic-section">
        <div className="mosaic-container">
          <div className="base-image">
            <img src={memorial.photo_url} alt={memorial.name} />
          </div>
          
          <div 
            className="mosaic-overlay"
            style={{ opacity: mosaicOpacity }}
          >
            <div className="mosaic-grid">
              {memorial.memories.map((memory, index) => (
                <div 
                  key={memory.id}
                  className="mosaic-tile"
                  style={{
                    backgroundColor: memory.dominant_colors[0] 
                      ? `rgb(${memory.dominant_colors[0].r}, ${memory.dominant_colors[0].g}, ${memory.dominant_colors[0].b})`
                      : '#ccc'
                  }}
                  title={`${memory.visitor_name}: ${memory.message}`}
                >
                  <img src={memory.photo_url} alt={memory.visitor_name} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mosaic-info">
          <h3>Memory Mosaic</h3>
          <p>
            {memorial.memories.length === 0 
              ? "Be the first to share a memory and start revealing the beautiful image."
              : `As more memories are shared, the image of ${memorial.name} becomes more visible.`
            }
          </p>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${mosaicOpacity * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {Math.round(mosaicOpacity * 100)}% revealed
          </p>
        </div>
      </div>

      <div className="memories-section">
        <div className="memories-header">
          <h2>Shared Memories</h2>
          <Link to={`/memorial/${id}/add-memory`} className="add-memory-btn">
            Add Your Memory
          </Link>
        </div>

        {memorial.memories.length === 0 ? (
          <div className="empty-memories">
            <div className="empty-icon">💝</div>
            <h3>No memories shared yet</h3>
            <p>Be the first to share a memory and photo</p>
            <Link to={`/memorial/${id}/add-memory`} className="btn btn-primary">
              Share First Memory
            </Link>
          </div>
        ) : (
          <div className="memories-grid">
            {memorial.memories.map((memory) => (
              <div key={memory.id} className="memory-card">
                <div className="memory-image">
                  <img src={memory.photo_url} alt={memory.visitor_name} />
                </div>
                <div className="memory-content">
                  <h4>{memory.visitor_name}</h4>
                  <p>{memory.message}</p>
                  <span className="memory-date">
                    {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemorialView;