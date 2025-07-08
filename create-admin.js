require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const Admin = require('./models/admin.model');

async function createAdmin() {
  await mongoose.connect(MONGO_URI);

  const email = 'info@teamgrid.com';
  const password = '123456';
  const role = 'admin';

  // Check if admin already exists
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  // Create admin (let model hash password)
  const admin = new Admin({ email, password, role });
  await admin.save();

  console.log('Admin created:', admin);
  process.exit(0);
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});