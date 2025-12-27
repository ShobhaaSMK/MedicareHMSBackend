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

// Bills API Tests
const testCreateBill = async () => {
    console.log('\n🧪 Testing CREATE Bill...');

    const billData = {
        BillNo: `TEST-BILL-${Date.now()}`,
        PatientId: '550e8400-e29b-41d4-a716-446655440001',
        BillType: 'OPD',
        DepartmentId: 1,
        DoctorId: 1,
        BillDateTime: new Date().toISOString(),
        TotalAmount: 1000.00,
        PaidStatus: 'Pending',
        PaidAmount: 0,
        PartialPaidAmount: 0,
        Balance: 1000.00,
        BillGeneratedBy: 1
    };

    const result = await makeRequest('POST', '/bills', billData);
    if (result.success) {
        testBillId = result.data.data.BillId;
        console.log('✅ Bill created successfully:', testBillId);
        console.log('   Bill details:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to create bill:', result.error);
        return false;
    }
};

const testGetAllBills = async () => {
    console.log('\n🧪 Testing GET All Bills...');

    const result = await makeRequest('GET', '/bills');
    if (result.success) {
        console.log('✅ Bills retrieved successfully');
        console.log(`   Total bills: ${result.data.data.length}`);
        console.log('   Pagination:', result.data.pagination);
        return true;
    } else {
        console.log('❌ Failed to get bills:', result.error);
        return false;
    }
};

const testGetBillById = async () => {
    console.log('\n🧪 Testing GET Bill by ID...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const result = await makeRequest('GET', `/bills/${testBillId}`);
    if (result.success) {
        console.log('✅ Bill retrieved successfully');
        console.log('   Bill details:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to get bill:', result.error);
        return false;
    }
};

const testUpdateBill = async () => {
    console.log('\n🧪 Testing UPDATE Bill...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const updateData = {
        BillType: 'IPD',
        TotalAmount: 1500.00,
        PaidStatus: 'Partial',
        PaidAmount: 500.00,
        PartialPaidAmount: 300.00
    };

    const result = await makeRequest('PUT', `/bills/${testBillId}`, updateData);
    if (result.success) {
        console.log('✅ Bill updated successfully');
        console.log('   Updated bill details:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to update bill:', result.error);
        return false;
    }
};

const testGetBillsByPatientId = async () => {
    console.log('\n🧪 Testing GET Bills by Patient ID...');

    const patientId = '550e8400-e29b-41d4-a716-446655440001';
    const result = await makeRequest('GET', `/bills/patient/${patientId}`);
    if (result.success) {
        console.log('✅ Bills by patient retrieved successfully');
        console.log(`   Bills for patient: ${result.data.data.length}`);
        return true;
    } else {
        console.log('❌ Failed to get bills by patient:', result.error);
        return false;
    }
};

const testGetBillsByType = async () => {
    console.log('\n🧪 Testing GET Bills by Type...');

    const result = await makeRequest('GET', '/bills/type/OPD');
    if (result.success) {
        console.log('✅ Bills by type retrieved successfully');
        console.log(`   OPD bills: ${result.data.data.length}`);
        return true;
    } else {
        console.log('❌ Failed to get bills by type:', result.error);
        return false;
    }
};

const testGetBillsByPaymentStatus = async () => {
    console.log('\n🧪 Testing GET Bills by Payment Status...');

    const result = await makeRequest('GET', '/bills/status/Pending');
    if (result.success) {
        console.log('✅ Bills by payment status retrieved successfully');
        console.log(`   Pending bills: ${result.data.data.length}`);
        return true;
    } else {
        console.log('❌ Failed to get bills by payment status:', result.error);
        return false;
    }
};

const testUpdatePaymentStatus = async () => {
    console.log('\n🧪 Testing UPDATE Payment Status...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const paymentData = {
        PaidStatus: 'Paid',
        PaidAmount: 1500.00,
        PartialPaidAmount: 0,
        ModeOfPayment: 'Cash'
    };

    const result = await makeRequest('PATCH', `/bills/${testBillId}/payment`, paymentData);
    if (result.success) {
        console.log('✅ Payment status updated successfully');
        console.log('   Updated bill:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to update payment status:', result.error);
        return false;
    }
};

const testGenerateBillNumber = async () => {
    console.log('\n🧪 Testing GENERATE Bill Number...');

    const result = await makeRequest('GET', '/bills/generate/billno');
    if (result.success) {
        console.log('✅ Bill number generated successfully');
        console.log('   Generated bill number:', result.data.data);
        return true;
    } else {
        console.log('❌ Failed to generate bill number:', result.error);
        return false;
    }
};

const testDeleteBill = async () => {
    console.log('\n🧪 Testing DELETE Bill...');

    if (!testBillId) {
        console.log('❌ No bill ID available for testing');
        return false;
    }

    const result = await makeRequest('DELETE', `/bills/${testBillId}`);
    if (result.success) {
        console.log('✅ Bill deleted successfully');
        return true;
    } else {
        console.log('❌ Failed to delete bill:', result.error);
        return false;
    }
};

// BillItems API Tests
const testCreateBillItem = async () => {
    console.log('\n🧪 Testing CREATE Bill Item...');

    // First create a bill for testing
    const billData = {
        BillNo: `TEST-BILL-ITEM-${Date.now()}`,
        PatientId: '550e8400-e29b-41d4-a716-446655440001',
        BillType: 'Consultation',
        DepartmentId: 1,
        DoctorId: 1,
        BillDateTime: new Date().toISOString(),
        TotalAmount: 500.00,
        PaidStatus: 'Pending',
        PaidAmount: 0,
        PartialPaidAmount: 0,
        Balance: 500.00,
        BillGeneratedBy: 1
    };

    const billResult = await makeRequest('POST', '/bills', billData);
    if (billResult.success) {
        testBillId = billResult.data.data.BillId;
        console.log('✅ Test bill created for bill items:', testBillId);
    } else {
        console.log('❌ Failed to create test bill for bill items:', billResult.error);
        return false;
    }

    const itemData = {
        BillId: testBillId,
        ItemCategory: 'Consultation',
        Quantity: 1,
        UnitPrice: 500.00,
        CreatedBy: 1
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
        return true;
    } else {
        console.log('❌ Failed to update bill item:', result.error);
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

const testGetBillItemsByCategory = async () => {
    console.log('\n🧪 Testing GET Bill Items by Category...');

    const result = await makeRequest('GET', '/bill-items/category/Consultation');
    if (result.success) {
        console.log('✅ Bill items by category retrieved successfully');
        console.log(`   Consultation items: ${result.data.data.length}`);
        return true;
    } else {
        console.log('❌ Failed to get bill items by category:', result.error);
        return false;
    }
};

const testGetBillItemsByStatus = async () => {
    console.log('\n🧪 Testing GET Bill Items by Status...');

    const result = await makeRequest('GET', '/bill-items/status/Active');
    if (result.success) {
        console.log('✅ Bill items by status retrieved successfully');
        console.log(`   Active items: ${result.data.data.length}`);
        return true;
    } else {
        console.log('❌ Failed to get bill items by status:', result.error);
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
        console.log('   Calculated total:', result.data.data.calculatedTotal);
        return true;
    } else {
        console.log('❌ Failed to recalculate bill total:', result.error);
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

// Main test runner
const runTests = async () => {
    console.log('🚀 Starting Comprehensive Bills and BillItems API Testing...\n');

    const billTests = [
        { name: 'Create Bill', func: testCreateBill },
        { name: 'Get All Bills', func: testGetAllBills },
        { name: 'Get Bill by ID', func: testGetBillById },
        { name: 'Update Bill', func: testUpdateBill },
        { name: 'Get Bills by Patient ID', func: testGetBillsByPatientId },
        { name: 'Get Bills by Type', func: testGetBillsByType },
        { name: 'Get Bills by Payment Status', func: testGetBillsByPaymentStatus },
        { name: 'Update Payment Status', func: testUpdatePaymentStatus },
        { name: 'Generate Bill Number', func: testGenerateBillNumber },
        { name: 'Delete Bill', func: testDeleteBill }
    ];

    const billItemTests = [
        { name: 'Create Bill Item', func: testCreateBillItem },
        { name: 'Get All Bill Items', func: testGetAllBillItems },
        { name: 'Get Bill Item by ID', func: testGetBillItemById },
        { name: 'Update Bill Item', func: testUpdateBillItem },
        { name: 'Get Bill Items by Bill ID', func: testGetBillItemsByBillId },
        { name: 'Get Bill Items by Category', func: testGetBillItemsByCategory },
        { name: 'Get Bill Items by Status', func: testGetBillItemsByStatus },
        { name: 'Bulk Create Bill Items', func: testBulkCreateBillItems },
        { name: 'Recalculate Bill Total', func: testRecalculateBillTotal },
        { name: 'Delete Bill Item', func: testDeleteBillItem }
    ];

    let billPassed = 0;
    let billFailed = 0;
    let billItemPassed = 0;
    let billItemFailed = 0;

    console.log('📋 Testing Bills APIs...\n');

    for (const test of billTests) {
        try {
            console.log(`\n📋 Running Bills Test: ${test.name}`);
            const result = await test.func();
            if (result) {
                billPassed++;
                console.log(`✅ ${test.name}: PASSED`);
            } else {
                billFailed++;
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            billFailed++;
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }

    console.log('\n📋 Testing BillItems APIs...\n');

    for (const test of billItemTests) {
        try {
            console.log(`\n📋 Running BillItems Test: ${test.name}`);
            const result = await test.func();
            if (result) {
                billItemPassed++;
                console.log(`✅ ${test.name}: PASSED`);
            } else {
                billItemFailed++;
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            billItemFailed++;
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`\n🏥 Bills APIs:`);
    console.log(`✅ Passed: ${billPassed}`);
    console.log(`❌ Failed: ${billFailed}`);
    console.log(`📈 Success Rate: ${billPassed + billFailed > 0 ? ((billPassed / (billPassed + billFailed)) * 100).toFixed(1) : 0}%`);

    console.log(`\n🧾 BillItems APIs:`);
    console.log(`✅ Passed: ${billItemPassed}`);
    console.log(`❌ Failed: ${billItemFailed}`);
    console.log(`📈 Success Rate: ${billItemPassed + billItemFailed > 0 ? ((billItemPassed / (billItemPassed + billItemFailed)) * 100).toFixed(1) : 0}%`);

    const totalPassed = billPassed + billItemPassed;
    const totalFailed = billFailed + billItemFailed;
    const totalTests = totalPassed + totalFailed;

    console.log(`\n🎯 Overall Results:`);
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📈 Overall Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);

    if (totalFailed === 0) {
        console.log('\n🎉 All Bills and BillItems API tests PASSED! Functionality is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
};

// Run the tests
runTests().catch(console.error);
