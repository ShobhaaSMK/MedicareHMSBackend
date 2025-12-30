// Test script for date validation in RoomVacantDate
const testDates = [
  // Valid date formats
  '2024-01-15',
  '2024-01-15T10:00:00Z',
  '2024-01-15T10:00:00.000Z',
  '2024-01-15 10:00:00',
  '01/15/2024',
  '15-Jan-2024',
  new Date('2024-01-15').toISOString(),

  // Invalid date formats that might cause issues
  '',
  null,
  undefined,
  'invalid-date',
  '2024-13-45', // Invalid month/day
  'not-a-date',
  '2024-01-15T25:00:00Z', // Invalid hour
  '2024-01-32', // Invalid day
  '2024-02-30', // Invalid date
  '2024/01/15', // Wrong separator
  '15/01/2024', // DD/MM/YYYY format
  '01-15-2024', // MM-DD-YYYY format
  '2024-1-15', // Single digit month
  '2024-01-5', // Single digit day
];

console.log('Testing date validation for RoomVacantDate:');
console.log('================================================');

testDates.forEach((dateInput, index) => {
  const date = new Date(dateInput);
  const isValid = !isNaN(date.getTime());

  console.log(`Test ${index + 1}: "${dateInput}" -> ${isValid ? 'VALID' : 'INVALID'}`);
  if (isValid) {
    console.log(`  Parsed as: ${date.toISOString()}`);
  }
  console.log('');
});

console.log('================================================');
console.log('Summary:');
console.log('- Valid formats: YYYY-MM-DD, ISO strings, some locale formats');
console.log('- Invalid formats: Empty strings, null, undefined, malformed dates');
console.log('- Potential issues: Different date formats from frontend/client');

// Test the actual validation logic from the controller
console.log('\nTesting controller validation logic:');
console.log('=====================================');

function validateRoomVacantDate(value) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, message: 'Null/empty value allowed' };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'RoomVacantDate must be a valid date' };
  }

  return { valid: true, message: 'Valid date' };
}

const testValues = [
  '2024-01-15',
  '2024-01-15T10:00:00Z',
  '',
  null,
  undefined,
  'invalid-date',
  '2024-13-45'
];

testValues.forEach((value, index) => {
  const result = validateRoomVacantDate(value);
  console.log(`Validation ${index + 1}: "${value}" -> ${result.valid ? 'PASS' : 'FAIL'} - ${result.message}`);
});
