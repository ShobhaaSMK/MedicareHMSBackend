# Get RoomBeds API Invoke Examples

## Base URL
`http://localhost:4000/api/room-beds`

---

## 1. Get All Room Beds

### Endpoint
`GET http://localhost:4000/api/room-beds`

### cURL
```bash
curl -X GET "http://localhost:4000/api/room-beds"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:4000/api/room-beds')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getAllRoomBeds() {
  try {
    const response = await fetch('http://localhost:4000/api/room-beds');
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getAllRoomBeds();
```

---

## 2. Get All Room Beds with Query Parameters (Filtering)

### Endpoint
`GET http://localhost:4000/api/room-beds?status=Active&roomCategory=AC&roomType=Special&roomNo=101`

### Query Parameters
- `status` - Filter by status (e.g., "Active", "InActive")
- `roomCategory` - Filter by room category (e.g., "AC", "Non AC")
- `roomType` - Filter by room type (e.g., "Special", "Special Shared", "Regular")
- `roomNo` - Filter by room number

### cURL Examples

**Get only Active beds:**
```bash
curl -X GET "http://localhost:4000/api/room-beds?status=Active"
```

**Get AC beds:**
```bash
curl -X GET "http://localhost:4000/api/room-beds?roomCategory=AC"
```

**Get Special rooms:**
```bash
curl -X GET "http://localhost:4000/api/room-beds?roomType=Special"
```

**Get beds in room 101:**
```bash
curl -X GET "http://localhost:4000/api/room-beds?roomNo=101"
```

**Combined filters:**
```bash
curl -X GET "http://localhost:4000/api/room-beds?status=Active&roomCategory=AC&roomType=Special"
```

### JavaScript Fetch with Query Parameters
```javascript
// Build query string
const params = new URLSearchParams({
  status: 'Active',
  roomCategory: 'AC',
  roomType: 'Special',
  roomNo: '101'
});

fetch(`http://localhost:4000/api/room-beds?${params}`)
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await with Query Parameters
```javascript
async function getFilteredRoomBeds(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`http://localhost:4000/api/room-beds?${params}`);
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage examples
getFilteredRoomBeds({ status: 'Active' });
getFilteredRoomBeds({ roomCategory: 'AC', roomType: 'Special' });
```

---

## 3. Get Room Bed by ID

### Endpoint
`GET http://localhost:4000/api/room-beds/:id`

### cURL
```bash
curl -X GET "http://localhost:4000/api/room-beds/1"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:4000/api/room-beds/1')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getRoomBedById(id) {
  try {
    const response = await fetch(`http://localhost:4000/api/room-beds/${id}`);
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getRoomBedById(1);
```

---

## 4. Get Room Bed by Bed Number

### Endpoint
`GET http://localhost:4000/api/room-beds/by-bedno/:bedNo`

### cURL
```bash
curl -X GET "http://localhost:4000/api/room-beds/by-bedno/B2025_12_0001"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:4000/api/room-beds/by-bedno/B2025_12_0001')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getRoomBedByBedNo(bedNo) {
  try {
    const response = await fetch(`http://localhost:4000/api/room-beds/by-bedno/${bedNo}`);
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getRoomBedByBedNo('B2025_12_0001');
```

---

## 5. Get Room Beds by Category

### Endpoint
`GET http://localhost:4000/api/room-beds/by-category/:category`

### Valid Categories
- `AC`
- `Non AC` (also accepts: "nonac", "non-ac", "non ac")

### cURL Examples

**Get AC beds:**
```bash
curl -X GET "http://localhost:4000/api/room-beds/by-category/AC"
```

**Get Non AC beds:**
```bash
curl -X GET "http://localhost:4000/api/room-beds/by-category/Non%20AC"
```

### JavaScript Fetch
```javascript
// Get AC beds
fetch('http://localhost:4000/api/room-beds/by-category/AC')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));

// Get Non AC beds (URL encode the space)
fetch('http://localhost:4000/api/room-beds/by-category/Non%20AC')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getRoomBedsByCategory(category) {
  try {
    const encodedCategory = encodeURIComponent(category);
    const response = await fetch(`http://localhost:4000/api/room-beds/by-category/${encodedCategory}`);
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getRoomBedsByCategory('AC');
getRoomBedsByCategory('Non AC');
```

---

## 6. Get Room Beds by Room Type

### Endpoint
`GET http://localhost:4000/api/room-beds/by-roomtype/:roomType`

### Valid Room Types
- `Special`
- `Special Shared`
- `Regular`

### cURL Examples

**Get Special rooms:**
```bash
curl -X GET "http://localhost:4000/api/room-beds/by-roomtype/Special"
```

**Get Special Shared rooms:**
```bash
curl -X GET "http://localhost:4000/api/room-beds/by-roomtype/Special%20Shared"
```

**Get Regular rooms:**
```bash
curl -X GET "http://localhost:4000/api/room-beds/by-roomtype/Regular"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:4000/api/room-beds/by-roomtype/Special')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getRoomBedsByRoomType(roomType) {
  try {
    const encodedRoomType = encodeURIComponent(roomType);
    const response = await fetch(`http://localhost:4000/api/room-beds/by-roomtype/${encodedRoomType}`);
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getRoomBedsByRoomType('Special');
getRoomBedsByRoomType('Special Shared');
getRoomBedsByRoomType('Regular');
```

---

## 7. Get Active Beds Count

### Endpoint
`GET http://localhost:4000/api/room-beds/count/active`

### cURL
```bash
curl -X GET "http://localhost:4000/api/room-beds/count/active"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:4000/api/room-beds/count/active')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getActiveBedsCount() {
  try {
    const response = await fetch('http://localhost:4000/api/room-beds/count/active');
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getActiveBedsCount();
```

---

## 8. Get IPD Room Counts by Type

### Endpoint
`GET http://localhost:4000/api/room-beds/count/by-roomtype`

### cURL
```bash
curl -X GET "http://localhost:4000/api/room-beds/count/by-roomtype"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:4000/api/room-beds/count/by-roomtype')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### JavaScript Async/Await
```javascript
async function getIPDRoomCountsByType() {
  try {
    const response = await fetch('http://localhost:4000/api/room-beds/count/by-roomtype');
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getIPDRoomCountsByType();
```

---

## Axios Examples

### Get All Room Beds
```javascript
const axios = require('axios');

axios.get('http://localhost:4000/api/room-beds')
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
```

### Get with Query Parameters
```javascript
const axios = require('axios');

axios.get('http://localhost:4000/api/room-beds', {
  params: {
    status: 'Active',
    roomCategory: 'AC',
    roomType: 'Special'
  }
})
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
```

---

## PowerShell Invoke-RestMethod Examples

### Get All Room Beds
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/room-beds" -Method Get
```

### Get with Query Parameters
```powershell
$params = @{
    status = "Active"
    roomCategory = "AC"
    roomType = "Special"
}

$queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
Invoke-RestMethod -Uri "http://localhost:4000/api/room-beds?$queryString" -Method Get
```

---

## Expected Response Format

### Success Response (Get All / Filtered)
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "RoomBedsId": 1,
      "BedNo": "B2025_12_0001",
      "RoomNo": "101",
      "RoomCategory": "AC",
      "RoomType": "Special",
      "Status": "Active",
      "CreatedBy": "Admin",
      "CreatedAt": "2025-12-04T...",
      "UpdatedAt": "2025-12-04T..."
    }
  ]
}
```

### Success Response (Get by ID / Bed No)
```json
{
  "success": true,
  "data": {
    "RoomBedsId": 1,
    "BedNo": "B2025_12_0001",
    "RoomNo": "101",
    "RoomCategory": "AC",
    "RoomType": "Special",
    "Status": "Active",
    "CreatedBy": "Admin",
    "CreatedAt": "2025-12-04T...",
    "UpdatedAt": "2025-12-04T..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Room bed not found"
}
```

---

## Notes

1. **Query Parameters**: All query parameters are optional and can be combined
2. **URL Encoding**: Use `encodeURIComponent()` for category and room type values with spaces
3. **Room Categories**: Valid values are "AC" and "Non AC" (case-insensitive variations accepted)
4. **Room Types**: Valid values are "Special", "Special Shared", and "Regular"
5. **Status**: Typically "Active" or "InActive"
6. **Ordering**: Results are ordered by BedNo in ascending order

