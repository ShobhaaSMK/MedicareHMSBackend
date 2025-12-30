// Test script for normalizeAdmissionStatus function
const allowedAdmissionStatus = ['Active', 'Moved to ICU', 'Surgery Scheduled', 'Discharged'];

const normalizeAdmissionStatus = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'active') return 'Active';
  if (normalized === 'moved to icu') return 'Moved to ICU';
  if (normalized === 'surgery scheduled') return 'Surgery Scheduled';
  if (normalized === 'discharged') return 'Discharged';
  return null;
};

// Test cases
const testCases = [
  { input: 'moved to icu', expected: 'Moved to ICU' },
  { input: 'MOVED TO ICU', expected: 'Moved to ICU' },
  { input: 'Moved To ICU', expected: 'Moved to ICU' },
  { input: 'moved_to_icu', expected: null },
  { input: 'active', expected: 'Active' },
  { input: 'ACTIVE', expected: 'Active' },
  { input: 'surgery scheduled', expected: 'Surgery Scheduled' },
  { input: 'SURGERY SCHEDULED', expected: 'Surgery Scheduled' },
  { input: 'discharged', expected: 'Discharged' },
  { input: 'DISCHARGED', expected: 'Discharged' },
  { input: null, expected: null },
  { input: undefined, expected: null },
  { input: '', expected: null },
  { input: 'invalid', expected: null },
];

console.log('Testing normalizeAdmissionStatus function:');
console.log('=====================================');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = normalizeAdmissionStatus(testCase.input);
  const success = result === testCase.expected;
  console.log(`Test ${index + 1}: ${success ? 'PASS' : 'FAIL'} - Input: "${testCase.input}" -> Expected: "${testCase.expected}", Got: "${result}"`);

  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log('=====================================');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All tests passed! The normalizeAdmissionStatus function is working correctly.');
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
}
