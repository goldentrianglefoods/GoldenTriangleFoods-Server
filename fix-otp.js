const mongoose = require('mongoose');
require('dotenv').config();

async function quickFix() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    
    const db = mongoose.connection.db;
    const collection = db.collection('otps');

    console.log('Deleting null email OTP records...');
    let result = await collection.deleteMany({ email: null });
    console.log(`Deleted ${result.deletedCount} records with null email`);

    console.log('Deleting null phone OTP records...');
    result = await collection.deleteMany({ phone: null });
    console.log(`Deleted ${result.deletedCount} records with null phone`);

    console.log('Dropping old indexes...');
    try {
      await collection.dropIndex('email_1_type_1');
      console.log('Dropped email_1_type_1');
    } catch (e) { }

    try {
      await collection.dropIndex('phone_1_type_1');
      console.log('Dropped phone_1_type_1');
    } catch (e) { }

    console.log('\n✅ Done! Now restart your server.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

quickFix();
