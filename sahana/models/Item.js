import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const itemSchema = new mongoose.Schema({
  // A stable public ID for the item, separate from MongoDB's _id.
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => `item_${randomUUID()}`
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  ownerId: {
    // References the authenticated user's _id from the User collection.
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
export default Item;
