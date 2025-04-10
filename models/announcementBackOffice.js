import mongoose from 'mongoose';

// Define the schema for announcements
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

// Avoid overwriting the model if it's already defined
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

// Export the model
export default Announcement;
