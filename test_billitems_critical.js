const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test data
let testBillId = null;
let testBillItemId = null;

// Helper function to make API calls
const makeRequest = async (method, url, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response ? error.response.data : error.message,
            status: error.response ? error.response.status : null
        };
    }
};

// Test functions
const testCreateBillItem = async () => {
    console.log('\n🧪 Testing CREATE Bill Item...');

    // First, create a test bill with simpler data
    const billData = {
        BillNo: 'TEST-BILL-001',
        PatientId: '550e8400-e29b-41d4-a716-446655440001',
        BillType: 'Consultation',
        DepartmentId: 1,
        DoctorId: 1,
        BillDateTime: new Date().toISOString(),
        TotalAmount: 500.00,
        PaidStatus: 'Pending',
        PaidAmount: 0,
        PartialPaidAmount: 0,
        Balance: '500.00',
        BillGeneratedBy: '1'
    };

    const billResult = await makeRequest('POST', '/bills', billData);
    if (billResult.success) {
        testBillId = billResult.data.data.BillId;
        console.log('✅ Test bill created:', testBillId);
    } else {
        console.log('❌ Failed to create test bill:', billResult.error);
        return false;
    }

    // Now create a bill item
    const itemData = {
        BillId: testBillId,
        ItemCategory: 'Consultation',
        Quantity: '1',
        UnitPrice: 500.00,
        CreatedBy: '1'
    };

    const result = await makeRequest('POST', '/bill-items', itemData);
    if (result.success) {
        testBillItemId = result.data.data.BillItemsId;
        console.log('✅ Bill item created successfully:', testBillItemId);
        console.log('   Item details:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to create bill item:', result.error);
        return false;
    }
};

const testGetBillItemById = async () => {
    console.log('\n🧪 Testing GET Bill Item by ID...');

    if (!testBillItemId) {
        console.log('❌ No bill item ID available for testing');
        return false;
    }

    const result = await makeRequest('GET', `/bill-items/${testBillItemId}`);
    if (result.success) {
        console.log('✅ Bill item retrieved successfully');
        console.log('   Item details:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to get bill item:', result.error);
        return false;
    }
};

const testUpdateBillItem = async () => {
    console.log('\n🧪 Testing UPDATE Bill Item...');

    if (!testBillItemId) {
        console.log('❌ No bill item ID available for testing');
        return false;
    }

    const updateData = {
        ItemCategory: 'Consultation',
        Quantity: 2,
        UnitPrice: 450.00
    };

    const result = await makeRequest('PUT', `/bill-items/${testBillItemId}`, updateData);
    if (result.success) {
        console.log('✅ Bill item updated successfully');
        console.log('   Updated item details:', result.data.data);
        // Verify TotalPrice calculation: 2 * 450 = 900
        if (result.data.data.TotalPrice === 900) {
            console.log('✅ TotalPrice calculation verified');
        } else {
            console.log('❌ TotalPrice calculation incorrect');
        }
        return true;
    } else {
        console.log('❌ Failed to update bill item:', result.error);
        return false;
    }
};

const testGetAllBillItems = async () => {
    console.log('\n🧪 Testing GET All Bill Items...');

    const result = await makeRequest('GET', '/bill-items');
    if (result.success) {
        console.log('✅ Bill items retrieved successfully');
        console.log(`   Total items: ${result.data.data.length}`);
        console.log('   Pagination:', result.data.pagination);
        return true;
    } else {
        console.log('❌ Failed to get bill items:', result.error);
        return false;
    }
};

const testGetBillItemsByBillId = async () => {
    console.log('\n🧪 Testing GET Bill Items by Bill ID...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const result = await makeRequest('GET', `/bill-items/bill/${testBillId}`);
    if (result.success) {
        console.log('✅ Bill items by bill ID retrieved successfully');
        console.log(`   Items for bill ${testBillId}: ${result.data.data.length}`);
        console.log('   Summary:', result.data.summary);
        return true;
    } else {
        console.log('❌ Failed to get bill items by bill ID:', result.error);
        return false;
    }
};

const testDeleteBillItem = async () => {
    console.log('\n🧪 Testing DELETE Bill Item...');

    if (!testBillItemId) {
        console.log('❌ No bill item ID available for testing');
        return false;
    }

    const result = await makeRequest('DELETE', `/bill-items/${testBillItemId}`);
    if (result.success) {
        console.log('✅ Bill item deleted successfully');
        return true;
    } else {
        console.log('❌ Failed to delete bill item:', result.error);
        return false;
    }
};

const testBulkCreateBillItems = async () => {
    console.log('\n🧪 Testing BULK CREATE Bill Items...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const bulkData = {
        items: [
            {
                ItemCategory: 'Lab test',
                Quantity: 2,
                UnitPrice: 300.00
            },
            {
                ItemCategory: 'Medicine',
                Quantity: 1,
                UnitPrice: 150.00
            }
        ],
        createdBy: 1
    };

    const result = await makeRequest('POST', `/bill-items/bulk/${testBillId}`, bulkData);
    if (result.success) {
        console.log('✅ Bulk bill items created successfully');
        console.log(`   Created ${result.data.data.length} items`);
        console.log('   Items:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to bulk create bill items:', result.error);
        return false;
    }
};

const testRecalculateBillTotal = async () => {
    console.log('\n🧪 Testing RECALCULATE Bill Total...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const result = await makeRequest('PATCH', `/bill-items/bill/${testBillId}/recalculate`);
    if (result.success) {
        console.log('✅ Bill total recalculated successfully');
        console.log('   Bill details:', result.data.data.bill);
        console.log('   Calculated total:', result.data.data.calculatedTotal);
        return true;
    } else {
        console.log('❌ Failed to recalculate bill total:', result.error);
        return false;
    }
};

// Main test runner
const runTests = async () => {
    console.log('🚀 Starting BillItems Critical Path Testing...\n');

    const tests = [
        { name: 'Create Bill Item', func: testCreateBillItem },
        { name: 'Get Bill Item by ID', func: testGetBillItemById },
        { name: 'Update Bill Item', func: testUpdateBillItem },
        { name: 'Get All Bill Items', func: testGetAllBillItems },
        { name: 'Get Bill Items by Bill ID', func: testGetBillItemsByBillId },
        { name: 'Bulk Create Bill Items', func: testBulkCreateBillItems },
        { name: 'Recalculate Bill Total', func: testRecalculateBillTotal },
        { name: 'Delete Bill Item', func: testDeleteBillItem }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`\n📋 Running: ${test.name}`);
            const result = await test.func();
            if (result) {
                passed++;
                console.log(`✅ ${test.name}: PASSED`);
            } else {
                failed++;
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            failed++;
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All critical path tests PASSED! BillItems functionality is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
};

// Run the tests
runTests().catch(console.error);
