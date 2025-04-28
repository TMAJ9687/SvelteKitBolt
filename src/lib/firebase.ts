// Import necessary functions from Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'; // Added Firestore functions
import { getStorage } from 'firebase/storage';
import { bots } from './bots'; // Assuming './bots' exports an array named 'bots'

// Firebase configuration object with your project's specific keys
// It's recommended to use environment variables for these in production
const firebaseConfig = {
  apiKey: "AIzaSyDGfACfclMzVwOd9Ff_r--pbk2Se22m5iw", // Your specific API Key
  authDomain: "chatwiisveltekit.firebaseapp.com",    // Your specific Auth Domain
  projectId: "chatwiisveltekit",                   // Your specific Project ID
  storageBucket: "chatwiisveltekit.firebasestorage.app", // Your specific Storage Bucket
  messagingSenderId: "901707969812",               // Your specific Messaging Sender ID
  appId: "1:901707969812:web:ded3ec5584ff3a25ff7e01", // Your specific App ID
  // measurementId: "G-JHYDNLM60Q" // Optional
};

// Variable to hold the Firebase app instance
let app;

// Exported variables to hold Firebase service instances
// These will be assigned after initialization
export let firebaseAuth;
export let firestore;
export let storage;

/**
 * Initialize Firebase and Bot Profiles in Firestore.
 * This async function should be called once when the application starts.
 */
export async function initializeFirebase() {
  // Prevent re-initialization
  if (app) {
    console.warn('Firebase is already initialized.');
    return;
  }

  try {
    // Initialize the Firebase app
    app = initializeApp(firebaseConfig);

    // Initialize Firebase services
    firebaseAuth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);

    // Initialize bot profiles in Firestore after core services are ready
    // Ensure Firestore rules allow this operation.
    await initializeBots();

    console.log('Firebase initialized successfully');

  } catch (error) {
    console.error('Error initializing Firebase:', error);
    // Consider more robust error handling for production
  }
}

/**
 * Writes bot profile data from the local 'bots' array to the 'profiles' collection in Firestore.
 * Assumes each bot object in the 'bots' array has a 'uid' property.
 */
async function initializeBots() {
  // Ensure firestore is initialized before proceeding
  if (!firestore) {
      console.error("Firestore is not initialized. Cannot initialize bots.");
      return;
  }
  try {
    // Get a reference to the 'profiles' collection
    const profilesRef = collection(firestore, 'profiles');

    // Use Promise.all for potentially better performance if there are many bots
    const botPromises = bots.map(bot => {
        // Validate that bot and bot.uid exist before creating doc reference
        if (!bot || !bot.uid) {
            console.warn("Skipping bot due to missing data:", bot);
            return Promise.resolve(); // Resolve immediately for invalid bot data
        }
        const botDocRef = doc(profilesRef, bot.uid);
        // Add/update each bot document in Firestore
        // merge: true prevents overwriting existing fields if the document already exists
        return setDoc(botDocRef, bot, { merge: true });
    });

    await Promise.all(botPromises);

    console.log('Bot profiles initialized/updated in Firestore.');

  } catch (error) {
    console.error('Error initializing bots in Firestore:', error);
    // Check Firestore rules if you encounter permission errors here.
  }
}

// Removed redundant exports:
// export { firebaseAuth }
// export { firestore }
