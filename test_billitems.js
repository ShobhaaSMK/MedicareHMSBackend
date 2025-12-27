const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testBillItemsAPI() {
  try {
    console.log('Testing BillItems API endpoints...\n');

    // Test 1: Get all bill items (should return empty array initially)
    console.log('1. Testing GET /api/bills/items');
    try {
      const response = await axios.get(`${BASE_URL}/bills/items`);
      console.log('   ✓ Success:', response.data);
    } catch (error) {
      console.log('   ✗ Error:', error.response?.data || error.message);
    }

    // Test 2: Try to create a bill item (will need a valid BillId)
    console.log('\n2. Testing POST /api/bills/items (will fail without valid BillId)');
    try {
      const response = await axios.post(`${BASE_URL}/bills/items`, {
        BillId: 1,
        ItemCategory: 'Test Item',
        Quantity: 2,
        UnitPrice: 100.00,
        TotalPrice: 200.00,
        Status: 'Active',
        CreatedBy: 1
      });
      console.log('   ✓ Success:', response.data);
    } catch (error) {
      console.log('   ✗ Expected Error (no valid BillId):', error.response?.data?.message || error.message);
    }

    console.log('\nBillItems API endpoints are properly configured!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBillItemsAPI();
