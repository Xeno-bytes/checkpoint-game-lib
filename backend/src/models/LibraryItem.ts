import { Schema, model, Document, Types } from 'mongoose';

export interface ILibraryItem extends Document {
  userId: Types.ObjectId;
  appId: number;
  status: 'Backlog' | 'In Progress' | 'On Hold' | 'Dropped' | 'Completed' | 'Endless';
  playtimeHours: number;
  rating?: number;
  reviewContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryItemSchema = new Schema<ILibraryItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Backlog', 'In Progress', 'On Hold', 'Dropped', 'Completed', 'Endless'],
      default: 'Backlog',
    },
    playtimeHours: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: null },
    reviewContent: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate entries of the same game for a single user
LibraryItemSchema.index({ userId: 1, appId: 1 }, { unique: true });

export const LibraryItem = model<ILibraryItem>('LibraryItem', LibraryItemSchema);