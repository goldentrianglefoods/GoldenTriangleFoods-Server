const mongoose = require('mongoose');
require('dotenv').config();

const OTP = require('./models/otp-model');

/**
 * Cleanup script to:
 * 1. Remove duplicate null email OTP records
 * 2. Drop old conflicting indexes
 * 3. Recreate proper partial indexes
 * 
 * Run once: node cleanup-otp-indexes.js
 */

async function cleanupOtpIndexes() {
  try {
    console.log('[OTP Cleanup] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    const db = mongoose.connection.db;
    const collection = db.collection('otps');

    console.log('\n[OTP Cleanup] Step 1: Checking existing indexes...');
    const indexes = await collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Drop old problematic indexes if they exist
    console.log('\n[OTP Cleanup] Step 2: Dropping old indexes...');
    const indexesToDrop = ['email_1', 'email_1_type_1', 'phone_1_type_1', 'phone_1'];
    
    for (const indexName of indexesToDrop) {
      if (indexes[indexName]) {
        try {
          await collection.dropIndex(indexName);
          console.log(`✓ Dropped index: ${indexName}`);
        } catch (err) {
          console.log(`⚠ Could not drop ${indexName}:`, err.message);
        }
      }
    }

    // Remove duplicate/null email OTP records
    console.log('\n[OTP Cleanup] Step 3: Removing duplicate null email records...');
    const nullEmailDocs = await collection.find({ email: null }).toArray();
    console.log(`Found ${nullEmailDocs.length} OTP records with null email`);
    
    if (nullEmailDocs.length > 0) {
      const result = await collection.deleteMany({ email: null });
      console.log(`✓ Deleted ${result.deletedCount} null email OTP records`);
    }

    // Remove duplicate/null phone OTP records
    console.log('\n[OTP Cleanup] Step 4: Removing duplicate null phone records...');
    const nullPhoneDocs = await collection.find({ phone: null }).toArray();
    console.log(`Found ${nullPhoneDocs.length} OTP records with null phone`);
    
    if (nullPhoneDocs.length > 0) {
      const result = await collection.deleteMany({ phone: null });
      console.log(`✓ Deleted ${result.deletedCount} null phone OTP records`);
    }

    // Recreate proper partial indexes via Mongoose
    console.log('\n[OTP Cleanup] Step 5: Creating new partial indexes...');
    await OTP.collection.dropIndexes();
    console.log('✓ Dropped all indexes from Mongoose schema');

    await OTP.syncIndexes();
    console.log('✓ Recreated all indexes from Mongoose schema');

    // Verify new indexes
    console.log('\n[OTP Cleanup] Step 6: Verifying new indexes...');
    const newIndexes = await collection.getIndexes();
    console.log('New indexes created:', Object.keys(newIndexes));

    console.log('\n✅ OTP Indexes cleanup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your server: npm run dev');
    console.log('2. Test OTP sending for email and phone');
    console.log('3. Monitor for duplicate key errors');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the cleanup
cleanupOtpIndexes();
