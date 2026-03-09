# Security Database Design

## Collections

### 1) `Security_Type`
- `_id: ObjectId`
- `name: String` (unique, required)
- `create.by: ObjectId`
- `create.datetime: Date`

Index:
- `{ name: 1 }` unique

### 2) `Security_Menu`
- `_id: ObjectId`
- `name: String` (required)
- `path: String` (unique, required)
- `type: ObjectId -> Security_Type._id` (required)
- `source: String` (`mapped` | `manual`)
- `create.by: ObjectId`
- `create.datetime: Date`

Index:
- `{ path: 1 }` unique

### 3) `Security_Group`
- `_id: ObjectId`
- `name: String` (unique, required)
- `description: String`
- `visibleType: ObjectId -> Security_Type._id` (required)
- `create.by: ObjectId`
- `create.datetime: Date`

Index:
- `{ name: 1 }` unique

### 4) `Security_Permission`
- `_id: ObjectId`
- `group: ObjectId -> Security_Group._id` (required)
- `menu: ObjectId -> Security_Menu._id` (required)
- `all: Boolean`
- `view: Boolean`
- `edit: Boolean`
- `delete: Boolean`
- `action: Boolean`
- `logs: Boolean`
- `create.by: ObjectId`
- `create.datetime: Date`

Index:
- `{ group: 1, menu: 1 }` unique

## Rule
- `Security_Permission` จะมีเฉพาะคู่ `group-menu` ที่ `group.visibleType === menu.type`
- เมื่อ create/update/delete ของ type/menu/group จะมีการ `syncPermissions()` เพื่อเติม/ลบแถว permission อัตโนมัติ

## API Mapping
- `GET /api/v1/security/bootstrap` -> โหลด `types, menus, groups, permissions`
- `GET/POST/PUT/DELETE /api/v1/security/type`
- `GET/POST/PUT/DELETE /api/v1/security/menu`
- `GET/POST/PUT/DELETE /api/v1/security/group`
- `GET /api/v1/security/permission`
- `PUT /api/v1/security/permission/bulk`
