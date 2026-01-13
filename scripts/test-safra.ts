import { FinanceUtils } from '../server/utils/finance'

// Mocking some scenarios
const scenarios = [
    {
        name: "User Example 1: Buy 15, Close 10 (Next Invoice)",
        purchase: new Date('2024-01-15T12:00:00'),
        close: 10,
        due: 17,
        expectedFirstDue: new Date('2024-02-17T00:00:00') // Jan 15 > Jan 10 -> Feb 10 Invoice -> Due Feb 17
    },
    {
        name: "User Example 2: Buy 15, Close 14 (Next Invoice)",
        purchase: new Date('2024-01-15T12:00:00'),
        close: 14,
        due: 21,
        expectedFirstDue: new Date('2024-02-21T00:00:00') // Jan 15 > Jan 14 -> Feb 14 Invoice -> Due Feb 21
    },
    {
        name: "Standard: Buy 05, Close 10 (Current Invoice - Same Month Payment)",
        purchase: new Date('2024-01-05T12:00:00'),
        close: 10,
        due: 17,
        expectedFirstDue: new Date('2024-01-17T00:00:00') // Jan 05 <= Jan 10 -> Jan 10 Invoice -> Due Jan 17
    },
    {
        name: "Cross Month: Buy 28, Close 25 (Next Invoice)",
        purchase: new Date('2024-01-28T12:00:00'), // Local time might affect this, usually use UTC or strip time
        close: 25,
        due: 5, // Due date is small number, implies next month relative to close
        expectedFirstDue: new Date('2024-03-05T00:00:00') 
        // Logic:
        // Jan 28 > Jan 25 -> Belongs to Feb 25 closing.
        // Feb 25 Closing with Due Day 5 -> Due Date is March 5 (since 5 < 25)
    },
    {
        name: "Cross Month: Buy 20, Close 25 (Current Invoice)",
        purchase: new Date('2024-01-20T12:00:00'),
        close: 25,
        due: 5, 
        expectedFirstDue: new Date('2024-02-05T00:00:00')
        // Logic:
        // Jan 20 <= Jan 25 -> Belongs to Jan 25 Closing.
        // Jan 25 Closing with Due Day 5 -> Due Date is Feb 5 (since 5 < 25)
    }
]

console.log("--- Running FinanceUtils Verification ---")
let passed = 0
let failed = 0

scenarios.forEach(s => {
    const result = FinanceUtils.calculateFirstDueDate(s.purchase, s.close, s.due)
    
    // Compare YYYY-MM-DD
    const resString = result.toISOString().split('T')[0]
    const expString = s.expectedFirstDue.toISOString().split('T')[0]

    if (resString === expString) {
        console.log(`[PASS] ${s.name}`)
        passed++
    } else {
        console.error(`[FAIL] ${s.name}`)
        console.error(`   Expected: ${expString}`)
        console.error(`   Got:      ${resString}`)
        failed++
    }
})

console.log(`\nResult: ${passed} Passed, ${failed} Failed`)

if (failed > 0) process.exit(1)
