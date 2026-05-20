# dp-admin

This admin portal runs on MongoDB and now supports migrating Dedicated Parents content from the legacy `CMS` database into a new `dp-admin` database.

## Migration: CMS -> dp-admin

Use the migration script to copy Dedicated Parents collections from source DB to target DB.

```bash
npm run migrate:cms -- --source mongodb://127.0.0.1:27017/CMS --target mongodb://127.0.0.1:27017/dp-admin --brand dedicated_parents --overwrite
```

### Useful flags

- `--source`: Source MongoDB URI (default: `mongodb://127.0.0.1:27017/CMS`)
- `--target`: Target MongoDB URI (default: `mongodb://127.0.0.1:27017/dp-admin`)
- `--brand`: Brand key in `collections` metadata (default: `dedicated_parents`)
- `--overwrite`: Clears target collection before copy
- `--dry-run`: Prints summary without writing data

### Collections migrated

- `dedicated_parents-blogs`
- `dedicated_parents-causes`
- `dedicated_parents-comments`
- `dedicated_parents-events`
- `dedicated_parents-gallery` or `dedicated_parents-galleries`
- `dedicated_parents-log` or `dedicated_parents-logs`
- `dedicated_parents-newsletters`
- `dedicated_parents-notifications`
- `dedicated_parents-staffs`
- `dedicated_parents-subscribers`
- `dedicated_parents-tickets`
- `dedicated_parents-users`
- `collections` metadata documents for the same brand/collections

## Portal access to migrated features

Legacy `/cms-data` inspection pages were removed from the admin UI.
