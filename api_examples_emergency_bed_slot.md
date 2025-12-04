# Emergency Bed Slot API - Create Examples

## API Endpoint
`POST http://localhost:4000/api/emergency-bed-slots`

## Required Fields
- `EmergencyBedId` (integer) - ID of the Emergency Bed
- `ESlotStartTime` (string) - Start time in HH:MM or HH:MM:SS format
- `ESlotEndTime` (string) - End time in HH:MM or HH:MM:SS format (must be after start time)

## Optional Fields
- `Status` (string) - "Active" or "Inactive" (defaults to "Active")

---

## PowerShell Examples

### Example 1: Create a morning slot (08:00 - 12:00)
```powershell
$body = @{
    EmergencyBedId = 7
    ESlotStartTime = "08:00"
    ESlotEndTime = "12:00"
    Status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/api/emergency-bed-slots -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

### Example 2: Create an afternoon slot (12:00 - 16:00)
```powershell
$body = @{
    EmergencyBedId = 7
    ESlotStartTime = "12:00"
    ESlotEndTime = "16:00"
    Status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/api/emergency-bed-slots -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

### Example 3: Create an evening slot (16:00 - 20:00)
```powershell
$body = @{
    EmergencyBedId = 8
    ESlotStartTime = "16:00"
    ESlotEndTime = "20:00"
    Status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/api/emergency-bed-slots -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

### Example 4: Create a night shift slot (20:00 - 23:59)
```powershell
$body = @{
    EmergencyBedId = 9
    ESlotStartTime = "20:00"
    ESlotEndTime = "23:59"
    Status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/api/emergency-bed-slots -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

### Example 5: Create a full day slot (00:00 - 23:59)
```powershell
$body = @{
    EmergencyBedId = 10
    ESlotStartTime = "00:00"
    ESlotEndTime = "23:59"
    Status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/api/emergency-bed-slots -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

### Example 6: Create with time in HH:MM:SS format
```powershell
$body = @{
    EmergencyBedId = 11
    ESlotStartTime = "09:30:00"
    ESlotEndTime = "17:45:00"
    Status = "Active"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:4000/api/emergency-bed-slots -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

---

## cURL Examples

### Example 1: Create a morning slot
```bash
curl -X POST http://localhost:4000/api/emergency-bed-slots \
  -H "Content-Type: application/json" \
  -d '{
    "EmergencyBedId": 7,
    "ESlotStartTime": "08:00",
    "ESlotEndTime": "12:00",
    "Status": "Active"
  }'
```

### Example 2: Create an afternoon slot
```bash
curl -X POST http://localhost:4000/api/emergency-bed-slots \
  -H "Content-Type: application/json" \
  -d '{
    "EmergencyBedId": 7,
    "ESlotStartTime": "12:00",
    "ESlotEndTime": "16:00",
    "Status": "Active"
  }'
```

### Example 3: Create an evening slot
```bash
curl -X POST http://localhost:4000/api/emergency-bed-slots \
  -H "Content-Type: application/json" \
  -d '{
    "EmergencyBedId": 8,
    "ESlotStartTime": "16:00",
    "ESlotEndTime": "20:00",
    "Status": "Active"
  }'
```

---

## JavaScript/Node.js Examples

### Example 1: Using fetch (Node.js 18+)
```javascript
const response = await fetch('http://localhost:4000/api/emergency-bed-slots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    EmergencyBedId: 7,
    ESlotStartTime: "08:00",
    ESlotEndTime: "12:00",
    Status: "Active"
  })
});

const result = await response.json();
console.log(result);
```

### Example 2: Using axios
```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:4000/api/emergency-bed-slots', {
  EmergencyBedId: 7,
  ESlotStartTime: "08:00",
  ESlotEndTime: "12:00",
  Status: "Active"
});

console.log(response.data);
```

---

## Common Time Slot Patterns

### Shift-based slots:
- **Morning Shift**: 08:00 - 12:00
- **Afternoon Shift**: 12:00 - 16:00
- **Evening Shift**: 16:00 - 20:00
- **Night Shift**: 20:00 - 00:00 (next day) or 20:00 - 23:59

### Hourly slots:
- **1-hour slot**: 09:00 - 10:00
- **2-hour slot**: 10:00 - 12:00
- **4-hour slot**: 08:00 - 12:00
- **6-hour slot**: 06:00 - 12:00
- **8-hour slot**: 08:00 - 16:00
- **12-hour slot**: 00:00 - 12:00 or 12:00 - 00:00

### Full day:
- **24-hour slot**: 00:00 - 23:59

---

## Response Format

### Success Response (201 Created):
```json
{
  "success": true,
  "message": "Emergency bed slot created successfully",
  "data": {
    "EmergencyBedSlotId": 12,
    "EmergencyBedId": 7,
    "EBedSlotNo": "EB_SL_12",
    "ESlotStartTime": "08:00:00",
    "ESlotEndTime": "12:00:00",
    "Status": "Active",
    "CreatedAt": "2025-12-03T10:15:13.048Z",
    "EmergencyBedNo": "ER-02",
    "EmergencyRoomDescription": "Emergency Room 1 - Critical Care Unit"
  }
}
```

### Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "A slot with the exact same timing already exists: EB_SL_10 (08:00:00 - 12:00:00)"
}
```

---

## Important Notes

1. **Time Format**: Accepts both `HH:MM` (e.g., "08:00") and `HH:MM:SS` (e.g., "08:00:00") formats
2. **End Time**: Must be after start time
3. **Duplicate Check**: Cannot create a slot with the exact same timing for the same Emergency Bed
4. **Overlap Check**: Cannot create overlapping slots for the same Emergency Bed
5. **EmergencyBedId**: Must exist in the EmergencyBed table
6. **Auto-generated**: `EBedSlotNo` is automatically generated (format: EB_SL_01, EB_SL_02, etc.)

