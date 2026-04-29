# Tagging System Migration Guide

This guide covers the deployment of the comprehensive tagging system for the contacts management application.

## Overview

The tagging system introduces three new fields to contacts:
- **tags**: Array of strings (lowercase, trimmed, max 10 tags per contact)
- **category**: Enum ['personal', 'work', 'family', 'business', 'other'] (nullable)
- **isFavorite**: Boolean (default: false)

Additionally, multiple indexes are created for efficient querying and a text search index enables full-text search across name, phone, address, and notes.

## Pre-Migration Checklist

1. **Backup your database** before running the migration:
   ```bash
   mongodump --db contacts_app --out ./backup-$(date +%Y%m%d)
   ```

2. **Ensure dependencies are installed**:
   ```bash
   cd contacts-backend
   npm install
   ```

3. **Verify your MongoDB connection** in `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/contacts_app
   ```

## Migration Steps

### 1. Run the migration script

The migration script adds default values for existing contacts:

```bash
cd contacts-backend
npm run migrate:add-tags-defaults
```

Or directly:

```bash
node scripts/migrate-add-tags-defaults.js
```

Expected output:
```
Connecting to mongodb://localhost:27017/contacts_app
Updated tags for X documents
Updated category for Y documents
Updated isFavorite for Z documents
Migration completed.
```

### 2. Verify indexes

Check that indexes were created by the Mongoose schema:

```javascript
// In MongoDB shell or Compass
db.contacts.getIndexes()
```

Expected indexes:
- `{ owner: 1, name: 1 }` (unique)
- `{ owner: 1, isFavorite: 1 }`
- `{ owner: 1, tags: 1 }`
- `{ owner: 1, category: 1 }`
- Text index on `{ name: 'text', phone: 'text', address: 'text', notes: 'text' }`

### 3. Restart the backend server

```bash
cd contacts-backend
npm run dev
```

## API Usage Examples

### 1. Get contacts with advanced filtering

```bash
# Get all contacts (basic)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?page=1&limit=10"

# Search by text
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?search=john"

# Filter by tags (OR logic - any of the tags)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?tags=client,vip&tagLogic=OR"

# Filter by tags (AND logic - all tags must match)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?tags=client,vip&tagLogic=AND"

# Filter by category
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?category=work"

# Filter by favorites only
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?isFavorite=true"

# Combined filters with sorting
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts?search=john&tags=client,vip&tagLogic=AND&category=business&isFavorite=true&sortBy=name&sortOrder=asc&page=1&limit=20"
```

### 2. Get all tags used by the user

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts/tags"
```

Response:
```json
{
  "tags": ["client", "urgent", "vip", "work"]
}
```

### 3. Get favorite contacts

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts/favorites"
```

### 4. Toggle favorite status

```bash
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/contacts/{contactId}/favorite"
```

### 5. Add/remove tags from a contact

```bash
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"add": ["client", "urgent"], "remove": ["old-tag"]}' \
  "http://localhost:8000/api/contacts/{contactId}/tags"
```

### 6. Create a contact with tags/category/favorite

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "address": "123 Main St",
    "notes": "Important client",
    "tags": ["client", "vip"],
    "category": "business",
    "isFavorite": true
  }' \
  "http://localhost:8000/api/contacts"
```

### 7. Update a contact (including tags/category/favorite)

```bash
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "phone": "1234567890",
    "address": "456 Oak St",
    "notes": "Updated notes",
    "tags": ["client", "vip", "premium"],
    "category": "work",
    "isFavorite": false
  }' \
  "http://localhost:8000/api/contacts/{contactId}"
```

## Response Format

All GET endpoints now return:

```json
{
  "contacts": [
    {
      "_id": "...",
      "name": "John Doe",
      "phone": "1234567890",
      "address": "123 Main St",
      "notes": "Important client",
      "tags": ["client", "vip"],
      "category": "business",
      "isFavorite": true,
      "owner": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  },
  "filters": {
    "search": "john",
    "tags": ["client", "vip"],
    "tagLogic": "AND",
    "category": "business",
    "isFavorite": "true",
    "sortBy": "name",
    "sortOrder": "asc"
  }
}
```

## Validation Rules

- **Tags**: Max 10 per contact, each tag max 20 characters, stored lowercase and trimmed
- **Category**: Must be one of: 'personal', 'work', 'family', 'business', 'other'
- **isFavorite**: Boolean value
- **tagLogic**: Must be 'AND' or 'OR'
- **sortBy**: Must be 'name', 'createdAt', or 'updatedAt'
- **sortOrder**: Must be 'asc' or 'desc'

## Frontend Integration

The frontend contacts component now includes:
- Tag filter with AND/OR logic
- Category dropdown filter
- Favorites checkbox filter
- Sorting controls (name/created/updated, asc/desc)
- Clear filters button

To test the frontend:

```bash
cd contacts-frontend
npm start
# Navigate to http://localhost:4200/contacts (after logging in)
```

## Troubleshooting

### Migration script fails with connection error

- Verify MongoDB is running: `mongosh` or `mongo`
- Check `.env` file has correct `MONGO_URI`
- Ensure network connectivity to MongoDB server

### Tags not showing in response

- Re-run the migration script
- Check that the Contact schema was updated (restart server)
- Verify indexes with `db.contacts.getIndexes()`

### Text search not working

- Ensure text index exists: `db.contacts.getIndexes()`
- If missing, recreate it:
  ```javascript
  db.contacts.createIndex({ name: 'text', phone: 'text', address: 'text', notes: 'text' })
  ```

### Validation errors on create/update

- Check that tags is an array of strings
- Verify category is a valid enum value
- Ensure isFavorite is boolean (not string)

## Rollback Plan

If issues occur, restore from backup:

```bash
mongorestore --db contacts_app ./backup-YYYYMMDD/contacts_app
```

Then revert code changes:

```bash
git revert <commit-hash>
```

## Testing Checklist

- [ ] Migration script runs successfully
- [ ] Existing contacts have default values (tags: [], category: null, isFavorite: false)
- [ ] Can create contacts with tags/category/favorite
- [ ] Can update contacts with tags/category/favorite
- [ ] Tag filtering works (both AND/OR logic)
- [ ] Category filtering works
- [ ] Favorite filtering works
- [ ] Text search works across name/phone/address/notes
- [ ] Combined filters work together
- [ ] Sorting works (name/created/updated, asc/desc)
- [ ] Pagination works with filters
- [ ] GET /contacts/tags returns unique tags
- [ ] PATCH /contacts/:id/favorite toggles favorite
- [ ] PATCH /contacts/:id/tags adds/removes tags
- [ ] Frontend displays tag filters and calls backend correctly
- [ ] Backward compatibility: old API calls still work

## Performance Considerations

- Indexes are created for efficient querying (owner+tags, owner+category, owner+isFavorite)
- Text index supports full-text search
- Pagination limits result set size
- Queries on indexed fields are fast

## Next Steps

Optional enhancements:
1. Add tag usage statistics (count contacts per tag)
2. Add tag autocomplete in frontend
3. Add bulk tag operations (tag multiple contacts at once)
4. Add tag colors/icons for visual categorization
5. Add export functionality with filtered results
6. Add unit tests for new endpoints
7. Add e2e tests for filtering scenarios

---

**Questions or Issues?** Check the backend logs for detailed error messages.
