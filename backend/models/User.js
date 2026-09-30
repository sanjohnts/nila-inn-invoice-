import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

/* what the browser is allowed to see (never the hash) */
userSchema.methods.toPublic = function(){
  return { id: this._id.toString(), name: this.name, email: this.email };
};

export default mongoose.model('User', userSchema);
