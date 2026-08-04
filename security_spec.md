# Security Specification: Aeirmist Social

## 1. Data Invariants
- A profile must belong to the user who created it ($request.auth.uid == ownerUid$).
- A post must have a valid authorId that the user owns.
- Usernames must be unique and tied to the creating UID.
- Followers/Following systems must be atomic (simulated via relational checks).
- Notifications can only be read by the recipient.
- Chat messages can only be read by conversation participants.

## 2. The "Dirty Dozen" Payloads (Attacker Strategy)
1. **The Identity Spoof**: Create a profile with `ownerUid: "someone_else_uid"`.
2. **The Ghost Field**: Update a post with `isAdmin: true` or `isVerified: true`.
3. **The Resource Poison**: Send a 2MB string as a `bio` or `post content`.
4. **The Orphaned Post**: Create a post with an `authorId` that doesn't exist or isn't owned by the user.
5. **The Time Warp**: Set `createdAt` to a date in the past or future.
6. **The Interaction Hijack**: Update another user's post `content`.
7. **The Notification Snoop**: Read notifications where `userId != auth.uid`.
8. **The ID Injection**: Create a document where the ID is `../../system/secret`. (Guarded by `isValidId`).
9. **The Blanket List**: Attempt to read all profiles without any query filters.
10. **The Self-Promotion**: Update own `auraLevel` directly.
11. **The Chat Leak**: Read messages in a conversation where the user is not a participant.
12. **The Terminal Bypass**: Update a "locked" post status.

## 3. Test Plan
- Verify all identity-based writes fail if `auth.uid` mismatch.
- Verify all size-based writes fail if exceeding limits.
- Verify all relational writes fail if the parent resource isn't owned.
