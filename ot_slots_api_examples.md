# OTSlots API Test Examples

Base URL: `http://localhost:4000/api/ot-slots`

## 1. Create OTSlot (POST)

Creates a new OT slot. OTSlotNo is auto-generated as an integer.

### Request
```bash
curl -X POST http://localhost:4000/api/ot-slots \
  -H "Content-Type: application/json" \
  -d '{
    "OTId": 1,
    "SlotStartTime": "09:00:00",
    "SlotEndTime": "10:30:00",
    "Status": "Active"
  }'
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/ot-slots" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "OTId": 1,
    "SlotStartTime": "09:00:00",
    "SlotEndTime": "10:30:00",
    "Status": "Active"
  }'
```

### Example Response
```json
{
  "success": true,
  "message": "OT slot created successfully",
  "data": {
    "OTSlotId": 1,
    "OTId": 1,
    "OTSlotNo": 1,
    "SlotStartTime": "09:00:00",
    "SlotEndTime": "10:30:00",
    "Status": "Active",
    "CreatedAt": "2024-01-15T10:30:00.000Z",
    "OTNo": "OT001",
    "OTName": "Operation Theater 1",
    "OTType": "General"
  }
}
```

### More Examples

**Create slot with InActive status:**
```bash
curl -X POST http://localhost:4000/api/ot-slots \
  -H "Content-Type: application/json" \
  -d '{
    "OTId": 1,
    "SlotStartTime": "14:00",
    "SlotEndTime": "15:30",
    "Status": "InActive"
  }'
```

**Create slot (Status defaults to Active if not provided):**
```bash
curl -X POST http://localhost:4000/api/ot-slots \
  -H "Content-Type: application/json" \
  -d '{
    "OTId": 2,
    "SlotStartTime": "11:00:00",
    "SlotEndTime": "12:30:00"
  }'
```

---

## 2. Get All OTSlots (GET)

Retrieves all OT slots with optional filtering.

### Request (All slots)
```bash
curl -X GET http://localhost:4000/api/ot-slots
```

### Request (Filter by Status)
```bash
curl -X GET "http://localhost:4000/api/ot-slots?status=Active"
```

### Request (Filter by OTId)
```bash
curl -X GET "http://localhost:4000/api/ot-slots?otId=1"
```

### Request (Filter by Status and OTId)
```bash
curl -X GET "http://localhost:4000/api/ot-slots?status=Active&otId=1"
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/ot-slots" -Method GET
```

### Example Response
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "OTSlotId": 1,
      "OTId": 1,
      "OTSlotNo": 1,
      "SlotStartTime": "09:00:00",
      "SlotEndTime": "10:30:00",
      "Status": "Active",
      "CreatedAt": "2024-01-15T10:30:00.000Z",
      "OTNo": "OT001",
      "OTName": "Operation Theater 1",
      "OTType": "General"
    },
    {
      "OTSlotId": 2,
      "OTId": 1,
      "OTSlotNo": 2,
      "SlotStartTime": "11:00:00",
      "SlotEndTime": "12:30:00",
      "Status": "Active",
      "CreatedAt": "2024-01-15T10:35:00.000Z",
      "OTNo": "OT001",
      "OTName": "Operation Theater 1",
      "OTType": "General"
    }
  ]
}
```

---

## 3. Get OTSlot by ID (GET)

Retrieves a specific OT slot by its ID.

### Request
```bash
curl -X GET http://localhost:4000/api/ot-slots/1
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/ot-slots/1" -Method GET
```

### Example Response
```json
{
  "success": true,
  "data": {
    "OTSlotId": 1,
    "OTId": 1,
    "OTSlotNo": 1,
    "SlotStartTime": "09:00:00",
    "SlotEndTime": "10:30:00",
    "Status": "Active",
    "CreatedAt": "2024-01-15T10:30:00.000Z",
    "OTNo": "OT001",
    "OTName": "Operation Theater 1",
    "OTType": "General"
  }
}
```

### Error Response (Not Found)
```json
{
  "success": false,
  "message": "OT slot not found"
}
```

---

## 4. Get OTSlots by OT ID (GET)

Retrieves all slots for a specific OT.

### Request
```bash
curl -X GET http://localhost:4000/api/ot-slots/by-ot/1
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/ot-slots/by-ot/1" -Method GET
```

### Example Response
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "OTSlotId": 1,
      "OTId": 1,
      "OTSlotNo": 1,
      "SlotStartTime": "09:00:00",
      "SlotEndTime": "10:30:00",
      "Status": "Active",
      "CreatedAt": "2024-01-15T10:30:00.000Z",
      "OTNo": "OT001",
      "OTName": "Operation Theater 1",
      "OTType": "General"
    },
    {
      "OTSlotId": 2,
      "OTId": 1,
      "OTSlotNo": 2,
      "SlotStartTime": "11:00:00",
      "SlotEndTime": "12:30:00",
      "Status": "Active",
      "CreatedAt": "2024-01-15T10:35:00.000Z",
      "OTNo": "OT001",
      "OTName": "Operation Theater 1",
      "OTType": "General"
    }
  ]
}
```

---

## 5. Update OTSlot (PUT)

Updates an existing OT slot. All fields are optional - only provide fields you want to update.

### Request (Update Status)
```bash
curl -X PUT http://localhost:4000/api/ot-slots/1 \
  -H "Content-Type: application/json" \
  -d '{
    "Status": "InActive"
  }'
```

### Request (Update Time Slot)
```bash
curl -X PUT http://localhost:4000/api/ot-slots/1 \
  -H "Content-Type: application/json" \
  -d '{
    "SlotStartTime": "10:00:00",
    "SlotEndTime": "11:30:00"
  }'
```

### Request (Update Multiple Fields)
```bash
curl -X PUT http://localhost:4000/api/ot-slots/1 \
  -H "Content-Type: application/json" \
  -d '{
    "OTId": 2,
    "SlotStartTime": "13:00:00",
    "SlotEndTime": "14:30:00",
    "Status": "Active"
  }'
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/ot-slots/1" `
  -Method PUT `
  -ContentType "application/json" `
  -Body '{
    "Status": "InActive"
  }'
```

### Example Response
```json
{
  "success": true,
  "message": "OT slot updated successfully",
  "data": {
    "OTSlotId": 1,
    "OTId": 1,
    "OTSlotNo": 1,
    "SlotStartTime": "10:00:00",
    "SlotEndTime": "11:30:00",
    "Status": "InActive",
    "CreatedAt": "2024-01-15T10:30:00.000Z",
    "OTNo": "OT001",
    "OTName": "Operation Theater 1",
    "OTType": "General"
  }
}
```

---

## 6. Delete OTSlot (DELETE)

Deletes an OT slot by ID.

### Request
```bash
curl -X DELETE http://localhost:4000/api/ot-slots/1
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/ot-slots/1" -Method DELETE
```

### Example Response
```json
{
  "success": true,
  "message": "OT slot deleted successfully",
  "data": {
    "OTSlotId": 1,
    "OTId": 1,
    "OTSlotNo": 1,
    "SlotStartTime": "09:00:00",
    "SlotEndTime": "10:30:00",
    "Status": "Active",
    "CreatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response (Not Found)
```json
{
  "success": false,
  "message": "OT slot not found"
}
```

---

## Field Validations

### Required Fields (for POST)
- `OTId` (integer) - Must reference an existing OT
- `SlotStartTime` (string) - Format: `HH:MM` or `HH:MM:SS` (e.g., "09:00" or "09:00:00")
- `SlotEndTime` (string) - Format: `HH:MM` or `HH:MM:SS` (e.g., "10:30" or "10:30:00")
- `Status` (optional) - Defaults to "Active" if not provided. Must be "Active" or "InActive"

### Validation Rules
- `SlotEndTime` must be after `SlotStartTime`
- `OTId` must exist in the OT table
- Time slots cannot overlap for the same OT (when Status is Active)
- `OTSlotNo` is auto-generated as an integer (1, 2, 3, etc.) for each OT

### Error Responses

**Invalid OTId:**
```json
{
  "success": false,
  "message": "OTId does not exist"
}
```

**Overlapping Time Slot:**
```json
{
  "success": false,
  "message": "Time slot overlaps with existing slot 1 (09:00:00 - 10:30:00)"
}
```

**Invalid Time Format:**
```json
{
  "success": false,
  "message": "SlotStartTime must be in HH:MM or HH:MM:SS format"
}
```

**Invalid Status:**
```json
{
  "success": false,
  "message": "Status must be Active or InActive"
}
```

---

## Postman/Insomnia Collection

### Environment Variables
- `base_url`: `http://localhost:4000`
- `ot_slot_id`: `1` (update after creating a slot)

### Collection Structure
1. **Create OTSlot** - POST `{{base_url}}/api/ot-slots`
2. **Get All OTSlots** - GET `{{base_url}}/api/ot-slots`
3. **Get OTSlot by ID** - GET `{{base_url}}/api/ot-slots/{{ot_slot_id}}`
4. **Get OTSlots by OT** - GET `{{base_url}}/api/ot-slots/by-ot/1`
5. **Update OTSlot** - PUT `{{base_url}}/api/ot-slots/{{ot_slot_id}}`
6. **Delete OTSlot** - DELETE `{{base_url}}/api/ot-slots/{{ot_slot_id}}`

---

## Testing Workflow

1. **First, ensure you have an OT created:**
   ```bash
   curl -X GET http://localhost:4000/api/ot/1
   ```

2. **Create a new OTSlot:**
   ```bash
   curl -X POST http://localhost:4000/api/ot-slots \
     -H "Content-Type: application/json" \
     -d '{"OTId": 1, "SlotStartTime": "09:00:00", "SlotEndTime": "10:30:00", "Status": "Active"}'
   ```

3. **Get all slots to verify:**
   ```bash
   curl -X GET http://localhost:4000/api/ot-slots
   ```

4. **Get the created slot by ID:**
   ```bash
   curl -X GET http://localhost:4000/api/ot-slots/1
   ```

5. **Update the slot status:**
   ```bash
   curl -X PUT http://localhost:4000/api/ot-slots/1 \
     -H "Content-Type: application/json" \
     -d '{"Status": "InActive"}'
   ```

6. **Delete the slot:**
   ```bash
   curl -X DELETE http://localhost:4000/api/ot-slots/1
   ```

---

## Notes

- The `OTSlotNo` field is automatically generated as an integer (1, 2, 3, etc.) for each OT
- Time slots are validated to prevent overlaps for the same OT when Status is "Active"
- All timestamps are returned in ISO 8601 format
- The API returns joined data including OT information (OTNo, OTName, OTType) in GET requests
