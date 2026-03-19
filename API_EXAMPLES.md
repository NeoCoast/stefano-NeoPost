# NeoPost API Testing Guide

**Base URL:** `https://neopost-api.onrender.com`

**Note:** Free tier cold starts take ~30 seconds on first request.

---

## Authentication

### 1. Sign Up

```bash
curl -X POST https://neopost-api.onrender.com/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "username": "your-username", "password": "YourPassword123!"}'
```

Response: `201 Created` — sends confirmation email

---

### 2. Confirm Email

Click the link in the confirmation email, or use the token:

```bash
curl "https://neopost-api.onrender.com/api/users/confirm?token=YOUR_CONFIRMATION_TOKEN"
```

Response: `200 OK` — account confirmed

---

### 3. Resend Confirmation

```bash
curl -X POST https://neopost-api.onrender.com/api/users/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

---

### 4. Sign In

```bash
curl -X POST https://neopost-api.onrender.com/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "YourPassword123!"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "...", "username": "...", "confirmed": true }
}
```

Save the `token` for authenticated requests.

---

### 5. Verify Token

```bash
curl -X GET https://neopost-api.onrender.com/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response: `204 No Content` (valid token) or `401 Unauthorized` (invalid)

---

## Posts

Set your token as an environment variable:
```bash
TOKEN="your-jwt-token-here"
```

### 6. Create Post

```bash
curl -X POST https://neopost-api.onrender.com/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "My First Post", "content": "Hello world!"}'
```

---

### 7. Get All Posts (User Profile)

```bash
curl https://neopost-api.onrender.com/api/users/1/posts
```

Response:
```json
{
  "data": [{ "id": 1, "title": "...", "content": "...", "createdAt": "...", "commentsCount": 0 }],
  "pagination": { "page": 1, "limit": 20, "total": 1, "hasMore": false }
}
```

---

### 8. Edit Post (within 1 hour of creation)

```bash
curl -X PATCH https://neopost-api.onrender.com/api/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Updated Title", "content": "Updated content"}'
```

---

### 9. Delete Post (soft delete)

```bash
curl -X DELETE https://neopost-api.onrender.com/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"
```

Response: `204 No Content`

---

## Comments

### 10. Create Comment on Post

```bash
curl -X POST https://neopost-api.onrender.com/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content": "Great post!"}'
```

---

### 11. Get Comments for Post

```bash
curl https://neopost-api.onrender.com/api/posts/1/comments
```

---

## Likes

### 12. Like a Post

```bash
curl -X POST https://neopost-api.onrender.com/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"
```

Response: `201 Created`

---

### 13. Unlike a Post

```bash
curl -X DELETE https://neopost-api.onrender.com/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"
```

Response: `200 OK`

---

### 14. Get Users Who Liked a Post

```bash
curl https://neopost-api.onrender.com/api/posts/1/likers \
  -H "Authorization: Bearer $TOKEN"
```

---

## User Profile & Follows

### 15. Get User Profile

```bash
curl https://neopost-api.onrender.com/api/users/1
```

Response:
```json
{
  "id": 1,
  "username": "stefano",
  "followerCount": 0,
  "followingCount": 0,
  "postsCount": 1,
  "commentsCount": 0
}
```

---

### 16. Follow a User

```bash
curl -X POST https://neopost-api.onrender.com/api/users/2/follow \
  -H "Authorization: Bearer $TOKEN"
```

Response: `201 Created`

---

### 17. Unfollow a User

```bash
curl -X DELETE https://neopost-api.onrender.com/api/users/2/follow \
  -H "Authorization: Bearer $TOKEN"
```

Response: `200 OK`

---

### 18. Get Followers

```bash
curl https://neopost-api.onrender.com/api/users/1/followers \
  -H "Authorization: Bearer $TOKEN"
```

---

### 19. Get Following

```bash
curl https://neopost-api.onrender.com/api/users/1/following \
  -H "Authorization: Bearer $TOKEN"
```

---

### 20. List All Confirmed Users

```bash
curl https://neopost-api.onrender.com/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## Pagination

Most list endpoints support pagination:

```bash
curl "https://neopost-api.onrender.com/api/users/1/posts?page=2&limit=10"
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Invalid input / validation error |
| `401` | Missing or invalid auth token |
| `403` | Forbidden (not owner, unconfirmed user, edit window expired) |
| `404` | Resource not found |
| `409` | Conflict (email/username already exists, already following) |