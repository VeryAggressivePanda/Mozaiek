import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './AddMemory.css';

const AddMemory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [memorial, setMemorial] = useState<any>(null);
  const [visitorName, setVisitorName] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetchMemorial();
  }, [id]);

  const fetchMemorial = async () => {
    try {
      const response = await axios.get(`/api/memorials/${id}`);
      setMemorial(response.data.memorial);
      
      // Check if memorial is private and we need password
      if (!response.data.memorial.is_public && !password) {
        setShowPasswordForm(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load memorial');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      setError('Invalid password');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!photo) {
      return setError('Please select a photo');
    }

    if (!visitorName.trim()) {
      return setError('Please enter your name');
    }

    if (!message.trim()) {
      return setError('Please enter a message');
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('visitorName', visitorName);
      formData.append('message', message);
      if (password) {
        formData.append('password', password);
      }

      await axios.post(`/api/memorials/${id}/memories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/memorial/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add memory');
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordForm) {
    return (
      <div className="add-memory-container">
        <div className="password-form">
          <h2>Private Memorial</h2>
          <p>This memorial is private. Please enter the password to add a memory.</p>
          
          {error && <div className="error-message">{error}</div>}
          
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
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="add-memory-container">
        <div className="loading">Loading memorial...</div>
      </div>
    );
  }

  return (
    <div className="add-memory-container">
      <div className="add-memory-card">
        <div className="memorial-info">
          <h1>Add Your Memory</h1>
          <h2>For {memorial.name}</h2>
          {memorial.description && (
            <p className="memorial-description">{memorial.description}</p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="memory-form">
          <div className="form-section">
            <h3>Your Photo</h3>
            <div 
              {...getRootProps()} 
              className={`dropzone ${isDragActive ? 'active' : ''} ${photoPreview ? 'has-photo' : ''}`}
            >
              <input {...getInputProps()} />
              {photoPreview ? (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Preview" />
                  <p>Click or drag to replace photo</p>
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="upload-icon">📸</div>
                  <p>{isDragActive ? 'Drop your photo here' : 'Click or drag to upload your photo'}</p>
                  <p className="upload-hint">Supports JPG, PNG, GIF (max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Your Memory</h3>
            
            <div className="form-group">
              <label htmlFor="visitorName">Your Name *</label>
              <input
                type="text"
                id="visitorName"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Your Message *</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a memory, story, or message..."
                rows={4}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || !photo}
            >
              {loading ? 'Adding Memory...' : 'Share Memory'}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate(`/memorial/${id}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemory;