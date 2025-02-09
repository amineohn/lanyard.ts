# Lanyard.ts

Lanyard.ts is a TypeScript implementation of [Lanyard](https://github.com/Phineas/lanyard), originally created by Phineas.

## API Reference

### Get presence by user ID

**Endpoint:**
```http
GET /api/v1/users/:userId
```
**Description:**
Retrieves the presence information of a user by their ID.

**Parameters:**
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId` | `string` | **Required**. The Discord user ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "1234567890",
    "kv": { "status": "online" }
  }
}
```

---

### Set Key-Value for a user

**Endpoint:**
```http
POST /api/v1/users/:userId/kv
```
**Description:**
Stores a key-value pair in a user's presence.

**Parameters:**
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId` | `string` | **Required**. The Discord user ID |
| `key` | `string` | **Required**. The key to store |
| `value` | `string` | **Required**. The value to store |

**Request Body:**
```json
{
  "key": "status",
  "value": "online"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "1234567890",
    "key": "status",
    "value": "online"
  }
}
```

---

### Get Key-Value for a user

**Endpoint:**
```http
GET /api/v1/users/:userId/kv
```
**Description:**
Retrieves a specific key-value pair or all key-value pairs for a user.

**Parameters:**
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId` | `string` | **Required**. The Discord user ID |
| `key` | `string` | Optional. The key to retrieve |

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "online"
  }
}
```

---

### Delete Key-Value for a user

**Endpoint:**
```http
DELETE /api/v1/users/:userId/kv
```
**Description:**
Deletes a specific key-value pair from a user's presence.

**Parameters:**
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId` | `string` | **Required**. The Discord user ID |
| `key` | `string` | **Required**. The key to delete |

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "1234567890",
    "key": "status"
  }
}
```
