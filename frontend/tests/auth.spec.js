const { test, expect } = require('@playwright/test');

test.describe('Admin Authentication', () => {
  test('BAL-REG-01: Admin Registration Flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/admin/register');

    // Fill Institute Information
    await page.fill('input[placeholder*="e.g. Pune Institute"]', 'Test Academy ' + Date.now());
    await page.selectOption('select', 'Engineering College/University');

    // Fill Account Credentials
    const testEmail = `admin_${Date.now()}@test.edu`;
    await page.fill('input[type="email"]', testEmail);
    
    // Using Strong Password: 8+ char, Upper, Symbol, Num
    const strongPassword = 'Password123!';
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(strongPassword);
    await passwordInputs[1].fill(strongPassword);

    // Submit form
    await page.click('button:has-text("Establish Institute")');

    // Expect alert and redirect
    page.on('dialog', dialog => dialog.accept());
    
    // Should redirect to sign-in page (as per RegisterAdmin.jsx line 74: navigate('/'))
    await expect(page).toHaveURL('/');
    
    console.log(`[Automation] -> BAL-REG-01 script verified and ready. Registered: ${testEmail}`);
  });
});
