import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // User's full name for display and profile use.
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  // Email is unique and normalized for login and account lookup.
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // Store only the hashed password, never the plain text value.
  password: {
    type: String,
    required: true
  },
  // Role field supports 'user' and 'admin' for protected routes.
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Timestamp when the user account was created.
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model, reusing it if Mongoose already compiled it in this process.
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
