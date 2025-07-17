import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Create Beautiful Memorials with
            <span className="highlight"> Mozaiek</span>
          </h1>
          <p className="hero-subtitle">
            Honor your loved ones with a unique digital memorial where friends and family 
            can share memories and photos, creating a beautiful mosaic that reveals their image.
          </p>
          
          {user ? (
            <div className="hero-actions">
              <Link to="/create-memorial" className="btn btn-primary">
                Create Memorial
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                View Dashboard
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </div>
          )}
        </div>
        
        <div className="hero-visual">
          <div className="mosaic-preview">
            <div className="mosaic-grid">
              {Array.from({ length: 64 }, (_, i) => (
                <div 
                  key={i} 
                  className="mosaic-tile"
                  style={{
                    backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    opacity: Math.random() * 0.8 + 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Upload a Photo</h3>
            <p>Start by uploading a photo of your loved one that will serve as the base for the memorial mosaic.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Share the Link</h3>
            <p>Share a private link with friends and family so they can contribute their memories and photos.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Watch It Grow</h3>
            <p>As more memories are added, the mosaic gradually reveals the beautiful image of your loved one.</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to Create a Memorial?</h2>
          <p>Join thousands of families who have created beautiful digital memorials with Mozaiek.</p>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-large">
              Start Your Memorial Today
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;