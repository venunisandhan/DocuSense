
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === 'LOCAL';
      },
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE'],
      default: 'LOCAL',
    },
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['HR', 'EMPLOYEE'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('User', userSchema);