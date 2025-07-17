const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get dominant colors from image
async function getDominantColors(imageBuffer, numColors = 5) {
  try {
    const image = sharp(imageBuffer);
    const { data, info } = await image
      .resize(100, 100) // Resize for faster processing
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    const colors = [];
    
    // Sample pixels and get colors
    for (let i = 0; i < pixels.length; i += 3) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      colors.push({ r, g, b });
    }

    // Simple color clustering (in a real app, you'd use a more sophisticated algorithm)
    const sampledColors = colors.filter((_, index) => index % 100 === 0).slice(0, numColors);
    return sampledColors;
  } catch (error) {
    console.error('Error getting dominant colors:', error);
    return [{ r: 128, g: 128, b: 128 }]; // Default gray
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mozaiek server is running' });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        { email, password: hashedPassword, name }
      ])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: data[0].id, email: data[0].email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: data[0].id, email: data[0].email, name: data[0].name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, data.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: data.id, email: data.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: data.id, email: data.email, name: data.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create memorial
app.post('/api/memorials', upload.single('photo'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, description, isPublic, password } = req.body;
    
    if (!req.file || !name) {
      return res.status(400).json({ error: 'Photo and name are required' });
    }

    // Process and resize the main photo
    const processedImage = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Get dominant colors
    const dominantColors = await getDominantColors(req.file.buffer);

    // Upload to Supabase Storage
    const fileName = `memorials/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, processedImage, {
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    // Create memorial record
    const { data, error } = await supabase
      .from('memorials')
      .insert([
        {
          user_id: decoded.userId,
          name,
          description,
          photo_url: publicUrl,
          is_public: isPublic === 'true',
          password: password ? await bcrypt.hash(password, 12) : null,
          dominant_colors: dominantColors
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Memorial created successfully',
      memorial: data[0]
    });
  } catch (error) {
    console.error('Create memorial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get memorial by ID
app.get('/api/memorials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('memorials')
      .select(`
        *,
        users(name),
        memories(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    res.json({ memorial: data });
  } catch (error) {
    console.error('Get memorial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add memory to memorial
app.post('/api/memorials/:id/memories', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { password, message, visitorName } = req.body;
    
    if (!req.file || !message || !visitorName) {
      return res.status(400).json({ error: 'Photo, message, and visitor name are required' });
    }

    // Get memorial
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('*')
      .eq('id', id)
      .single();

    if (memorialError || !memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Check password if memorial is private
    if (!memorial.is_public && memorial.password) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }
      
      const isValidPassword = await bcrypt.compare(password, memorial.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Process and resize the memory photo
    const processedImage = await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Get dominant colors
    const dominantColors = await getDominantColors(req.file.buffer);

    // Upload to Supabase Storage
    const fileName = `memories/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, processedImage, {
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    // Create memory record
    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          memorial_id: id,
          visitor_name: visitorName,
          message,
          photo_url: publicUrl,
          dominant_colors: dominantColors
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Memory added successfully',
      memory: data[0]
    });
  } catch (error) {
    console.error('Add memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's memorials
app.get('/api/user/memorials', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ memorials: data });
  } catch (error) {
    console.error('Get user memorials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete memory (owner only)
app.delete('/api/memories/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;

    // Get memory and check ownership
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .select(`
        *,
        memorials(user_id)
      `)
      .eq('id', id)
      .single();

    if (memoryError || !memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    if (memory.memorials.user_id !== decoded.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete memory
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Mozaiek server running on port ${PORT}`);
});