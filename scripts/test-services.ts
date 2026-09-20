import { sendDailyKhataTallyEmail, sendAuthOtpEmail } from '../src/lib/mail';
import { generateAndSendOtp, verifyOtp, DEFAULT_OWNER_PHONE } from '../src/lib/auth';
import { getKhataCustomers, generateEveningTallyAndEmail } from '../src/lib/khata';

async function testServices() {
  console.log('--- 1. Testing Auth OTP System ---');
  const testPhone = DEFAULT_OWNER_PHONE; // 9981154672
  const otpRes = await generateAndSendOtp(testPhone);
  console.log(`Generated OTP result:`, otpRes);

  // Verify pre-configured master PIN '8817'
  const validMaster = verifyOtp(testPhone, '8817');
  console.log(`Verify master PIN 8817:`, validMaster.success ? '✅ PASS' : `❌ FAIL: ${validMaster.error}`);

  // Test invalid OTP
  const invalidOtp = verifyOtp(testPhone, '0000');
  console.log(`Verify invalid OTP 0000:`, !invalidOtp.success ? '✅ PASS (Correctly rejected)' : '❌ FAIL');

  console.log('\n--- 2. Testing Khata Ledger ---');
  const customers = await getKhataCustomers();
  const totalBalancePaise = customers.reduce((acc, c) => acc + c.totalCreditPaise, 0);
  console.log(`Total Customers in Khata: ${customers.length}`);
  console.log(`Total Outstanding Balance: ₹${(totalBalancePaise / 100).toFixed(2)}`);

  console.log('\n--- 3. Testing Evening Tally Email via Purelymail SMTP ---');
  console.log('Dispatching evening tally email to slowbros@shivvx.in...');
  const emailRes = await generateEveningTallyAndEmail();
  console.log(`Email result:`, emailRes);

  console.log('\n🎉 ALL SERVICES TEST COMPLETED!');
}

testServices().catch(console.error);
