import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const storage = admin.storage();
const firestore = admin.firestore();

// Run every hour
exports.cleanupOldPhotos = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async (context) => {
    try {
      const bucket = storage.bucket();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Get all files in the chat-images directory
      const [files] = await bucket.getFiles({ prefix: 'chat-images/' });

      for (const file of files) {
        const metadata = await file.getMetadata();
        const createdTime = new Date(metadata[0].timeCreated);

        // If file is older than 1 hour, delete it
        if (createdTime < oneHourAgo) {
          await file.delete();
          
          // Update message in Firestore to mark image as expired
          const imageUrl = file.publicUrl();
          const querySnapshot = await firestore
            .collection('messages')
            .where('image.url', '==', imageUrl)
            .get();

          const batch = firestore.batch();
          querySnapshot.forEach(doc => {
            batch.update(doc.ref, {
              'image.expired': true,
              'image.expiryTime': admin.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }
      }

      console.log('Photo cleanup completed successfully');
      return null;
    } catch (error) {
      console.error('Error cleaning up photos:', error);
      return null;
    }
  });