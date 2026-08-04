/**
 * Admin Script: Cleanup Orphaned Data
 * 
 * This script scans specified Firestore collections and deletes documents 
 * that refer to a Firebase Auth UID which no longer exists.
 *
 * Instructions:
 * 1. Ensure you have the 'firebase-admin' package installed: npm install firebase-admin
 * 2. Obtain your service account JSON file from your Firebase console.
 * 3. Export your service account credentials as GOOGLE_APPLICATION_CREDENTIALS:
 *    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account.json"
 *
 * Usage:
 * Dry-run (Print items to be deleted): 
 *    node scripts/cleanup-orphaned-data.js
 * 
 * Execute (Actually delete items): 
 *    node scripts/cleanup-orphaned-data.js --execute
 */

const admin = require('firebase-admin');

// Initialize admin SDK (uses GOOGLE_APPLICATION_CREDENTIALS env var)
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const auth = admin.auth();
const args = process.argv.slice(2);
const execute = args.includes('--execute');

async function getValidUids() {
    const uids = new Set();
    let nextPageToken;
    do {
        const listUsersResult = await auth.listUsers(1000, nextPageToken);
        listUsersResult.users.forEach(user => uids.add(user.uid));
        nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    return uids;
}

async function cleanup() {
    console.log(`--------------------------------------------------`);
    console.log(`Fetching valid UIDs... ${execute ? '[!! EXECUTE MODE !!]' : '[DRY RUN MODE] - No deletions will be performed'}`);
    console.log(`--------------------------------------------------`);
    
    const validUids = await getValidUids();
    console.log(`Found ${validUids.size} valid Auth UIDs.`);

    // Mapping collections to the field containing the UID
    const collectionsToScan = [
        { name: 'profiles', field: 'ownerUid' },
        { name: 'posts', field: 'authorUid' },
        { name: 'usernames', field: 'uid' },
        { name: 'stories', field: 'ownerUid' } // Assuming ownerUid based on similarity
    ];

    for (const coll of collectionsToScan) {
        console.log(`\nScanning collection: ${coll.name} (checking field: ${coll.field})...`);
        const snapshot = await db.collection(coll.name).get();
        let toDelete = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const uid = data[coll.field];
            
            // If the field exists and the UID is not in our valid set, it's orphaned
            if (uid && !validUids.has(uid)) {
                toDelete.push(doc);
            }
        });

        if (toDelete.length === 0) {
            console.log(`  No orphaned docs found in ${coll.name}.`);
        } else {
            console.log(`  Found ${toDelete.length} orphaned docs:`);
            for (const doc of toDelete) {
                console.log(`    - DocID: ${doc.id} (Ref UID: ${doc.data()[coll.field]})`);
                if (execute) {
                    await doc.ref.delete();
                    console.log(`      [DELETED]`);
                }
            }
        }
    }

    console.log(`\n--------------------------------------------------`);
    console.log(`Cleanup process finished.`);
    if (!execute) {
        console.log(`IMPORTANT: This was a DRY RUN. No data was deleted.`);
        console.log(`Run with --execute to perform deletions.`);
    } else {
        console.log(`EXECUTION COMPLETE: Orphaned documents were removed.`);
    }
    console.log(`--------------------------------------------------`);
}

cleanup().catch(err => {
    console.error('Error during cleanup:', err);
    process.exit(1);
});
