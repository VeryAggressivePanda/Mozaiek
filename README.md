# Mozaiek - Digital Memorial Service

A beautiful online memorial service where people can create digital memorials for their loved ones. Friends and family can share memories and photos, which are automatically analyzed for color and placed in a mosaic that gradually reveals the deceased person's image.

## Features

- **User Authentication**: Secure registration and login system
- **Memorial Creation**: Upload photos and create personalized memorials
- **Privacy Controls**: Set memorials as public or private with password protection
- **Memory Sharing**: Visitors can add photos and messages to memorials
- **Color Analysis**: Automatic color extraction from uploaded photos
- **Mosaic Generation**: Photos are placed in a grid that reveals the memorial image
- **Responsive Design**: Beautiful, modern UI that works on all devices

## Technology Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **React Dropzone** for file uploads

### Backend
- **Node.js** with Express
- **Supabase** for database and file storage
- **Sharp** for image processing
- **Multer** for file upload handling
- **JWT** for authentication
- **Bcrypt** for password hashing

## Project Structure

```
Mozaiek/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Main server file
│   ├── package.json
│   └── .env.example       # Environment variables template
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VeryAggressivePanda/Mozaiek.git
   cd Mozaiek
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Set up the following tables:
     - `users` (id, email, password, name, created_at)
     - `memorials` (id, user_id, name, description, photo_url, is_public, password, dominant_colors, created_at)
     - `memories` (id, memorial_id, visitor_name, message, photo_url, dominant_colors, created_at)
   - Create a storage bucket called `photos`
   - Get your Supabase URL and API keys

3. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   ```

4. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```

5. **Start the Development Servers**

   **Backend:**
   ```bash
   cd server
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd client
   npm start
   ```

   The frontend will run on `http://localhost:3000` and the backend on `http://localhost:5000`.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Memorials Table
```sql
CREATE TABLE memorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  photo_url VARCHAR NOT NULL,
  is_public BOOLEAN DEFAULT true,
  password VARCHAR,
  dominant_colors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Memories Table
```sql
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memorial_id UUID REFERENCES memorials(id) ON DELETE CASCADE,
  visitor_name VARCHAR NOT NULL,
  message TEXT NOT NULL,
  photo_url VARCHAR NOT NULL,
  dominant_colors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Memorials
- `POST /api/memorials` - Create a new memorial
- `GET /api/memorials/:id` - Get memorial by ID
- `GET /api/user/memorials` - Get user's memorials

### Memories
- `POST /api/memorials/:id/memories` - Add memory to memorial
- `DELETE /api/memories/:id` - Delete memory (owner only)

## How It Works

1. **Memorial Creation**: Users upload a photo of their loved one and set privacy settings
2. **Photo Analysis**: The system analyzes the dominant colors in the uploaded photo
3. **Memory Collection**: Friends and family add their photos and messages
4. **Mosaic Generation**: Each memory photo is placed in a grid based on color matching
5. **Progressive Revelation**: As more memories are added, the original photo becomes more visible

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@mozaiek.com or create an issue in the GitHub repository.

## Acknowledgments

- Built with love for families honoring their loved ones
- Inspired by the beautiful concept of collective memory
- Thanks to the open source community for the amazing tools used in this project