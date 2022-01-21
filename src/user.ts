import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
	ID: {
		type: String,
		required: true,
		unique: true
	}
})

const User = mongoose.model('User', UserSchema);

export { User }