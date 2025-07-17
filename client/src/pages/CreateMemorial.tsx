import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './CreateMemorial.css';

const CreateMemorial: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

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

    if (!name.trim()) {
      return setError('Please enter a name for the memorial');
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('isPublic', isPublic.toString());
      if (!isPublic && password) {
        formData.append('password', password);
      }

      const response = await axios.post('/api/memorials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/memorial/${response.data.memorial.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create memorial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-memorial-container">
      <div className="create-memorial-card">
        <h1>Create a Memorial</h1>
        <p className="subtitle">
          Honor your loved one by creating a beautiful digital memorial
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-section">
            <h3>Upload Photo</h3>
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
                  <p>{isDragActive ? 'Drop the photo here' : 'Click or drag to upload a photo'}</p>
                  <p className="upload-hint">Supports JPG, PNG, GIF (max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Memorial Details</h3>
            
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter the name of your loved one"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share a brief description or memory..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Privacy Settings</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="checkmark"></span>
                Make this memorial public
              </label>
              <p className="form-hint">
                Public memorials can be viewed by anyone with the link
              </p>
            </div>

            {!isPublic && (
              <div className="form-group">
                <label htmlFor="password">Access Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password for private access"
                />
                <p className="form-hint">
                  Visitors will need this password to view and add memories
                </p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="create-btn" 
              disabled={loading || !photo}
            >
              {loading ? 'Creating Memorial...' : 'Create Memorial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMemorial;