
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId;
const db = getFirestore(app, dbId);

async function deleteUserPosts(handle: string) {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('username', '==', handle.toLowerCase().replace('@', '')));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log('No user found with handle:', handle);
        return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    console.log('Found user ID:', userId);
    
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    
    console.log('Found', postsSnapshot.size, 'posts to delete.');
    
    for (const postDoc of postsSnapshot.docs) {
        await deleteDoc(doc(db, 'posts', postDoc.id));
        console.log('Deleted post:', postDoc.id);
    }
}

deleteUserPosts('VBJJJBBVJJJ');
