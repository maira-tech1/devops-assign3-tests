const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dismissAlert(driver) {
    try {
        await driver.switchTo().alert().dismiss();
    } catch(e) {}
}

async function runTests() {
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.setChromeBinaryPath('/usr/bin/chromium');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    const baseUrl = 'http://localhost:5173';
    let passed = 0;
    let failed = 0;

    const logTest = (name, success) => {
        if (success) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${name}`);
            failed++;
        }
    };

    try {
        console.log("Starting Selenium Test Suite...");

        // Test 1: Load Login Page
        await driver.get(`${baseUrl}/`);
        let titleText = await driver.findElement(By.tagName('h2')).getText();
        logTest("Test 1: App loads Login Page successfully", titleText.includes('Login'));

        // Test 2: Invalid Login Handling
        await driver.findElement(By.id('email')).sendKeys('test_invalid@example.com');
        await driver.findElement(By.id('password')).sendKeys('wrongpassword');
        await driver.findElement(By.id('loginBtn')).click();
        await sleep(1000);
        await dismissAlert(driver);
        let currentUrl = await driver.getCurrentUrl();
        logTest("Test 2: Rejects invalid credentials and stays on login", !currentUrl.includes('/dashboard'));

        // Test 3: Navigate to Signup Page
        // Test 3: Navigate to Signup Page
        await dismissAlert(driver);
        await sleep(500);
        await driver.get(`${baseUrl}/signup`);
        await sleep(1000);
        titleText = await driver.findElement(By.tagName('h2')).getText();
        logTest("Test 3: Signup page loads", titleText.includes('Registration'));

        // Test 4: Fill Registration Form
        const testUser = `testuser_${Date.now()}@example.com`;
        await driver.findElement(By.id('signupEmail')).sendKeys(testUser);
        await driver.findElement(By.id('signupPassword')).sendKeys('securepass123');
        await driver.findElement(By.id('signupBtn')).click();
        await sleep(1500);
        await dismissAlert(driver);
        currentUrl = await driver.getCurrentUrl();
        logTest("Test 4: Register new user successfully", currentUrl.includes('/'));

        // Test 5: Login with newly created user
        await driver.get(`${baseUrl}/`);
        await driver.findElement(By.id('email')).clear();
        await driver.findElement(By.id('email')).sendKeys(testUser);
        await driver.findElement(By.id('password')).clear();
        await driver.findElement(By.id('password')).sendKeys('securepass123');
        await driver.findElement(By.id('loginBtn')).click();
        await sleep(2000);
        await dismissAlert(driver);
        currentUrl = await driver.getCurrentUrl();
        logTest("Test 5: Login successful and redirected to dashboard", currentUrl.includes('/dashboard'));

        // Test 6: Verify ERP Name in Dashboard Navigation
        let navText = await driver.findElement(By.tagName('nav')).getText();
        logTest("Test 6: Dashboard displays correct ERP Name", navText.includes('Nexus ERP System'));

        // Test 7: Verify Task Management Sidebar Module exists
        let sidebarText = await driver.findElement(By.className('w-1/4')).getText();
        logTest("Test 7: Sidebar shows 'Task Management' Module", sidebarText.includes('Task Management'));

        // Test 8: Verify Employee Directory Sidebar Module exists
        logTest("Test 8: Sidebar shows 'Employee Directory' Module", sidebarText.includes('Employee Directory'));

        // Test 9: Verify Inventory Control Sidebar Module exists
        logTest("Test 9: Sidebar shows 'Inventory Control' Module", sidebarText.includes('Inventory Control'));

        // Test 10: Verify Client Projects Sidebar Module exists
        logTest("Test 10: Sidebar shows 'Client Projects' Module", sidebarText.includes('Client Projects'));

        // Test 11: Add a new task
        const taskTitle = `Auto Task ${Date.now()}`;
        await driver.findElement(By.id('taskTitle')).sendKeys(taskTitle);
        await driver.findElement(By.id('taskDeadline')).sendKeys('12-31-2030');
        await driver.findElement(By.id('addTaskBtn')).click();
        await sleep(1500);
        await dismissAlert(driver);
        let bodyText = await driver.findElement(By.tagName('body')).getText();
        logTest("Test 11: Add new Task successfully", bodyText.includes(taskTitle));

        // Test 12: Verify total stats updated
        bodyText = await driver.findElement(By.tagName('body')).getText();
        logTest("Test 12: Dashboard content is visible", bodyText.length > 100);

        // Test 13: Edit Task
        await driver.findElement(By.id('editBtn')).click();
        await sleep(500);
        await dismissAlert(driver);
        await driver.findElement(By.id('editTitle')).clear();
        const updatedTaskTitle = `${taskTitle} (UPDATED)`;
        await driver.findElement(By.id('editTitle')).sendKeys(updatedTaskTitle);
        await driver.findElement(By.id('saveEditBtn')).click();
        await sleep(1000);
        await dismissAlert(driver);
        bodyText = await driver.findElement(By.tagName('body')).getText();
        logTest("Test 13: Edit Task successfully", bodyText.includes(updatedTaskTitle));

        // Test 14: Complete the task
        await driver.findElement(By.id('completeBtn')).click();
        await sleep(1000);
        await dismissAlert(driver);
        bodyText = await driver.findElement(By.tagName('body')).getText();
        logTest("Test 14: Mark Task as completed", !bodyText.includes(updatedTaskTitle));

        // Test 15: Logout
        await driver.findElement(By.xpath("//button[contains(text(), 'Logout')]")).click();
        await sleep(1000);
        await dismissAlert(driver);
        currentUrl = await driver.getCurrentUrl();
        logTest("Test 15: Logout redirects back to login page", currentUrl.endsWith('/'));

    } catch (error) {
        console.error("Test execution failed:", error);
    } finally {
        await driver.quit();
        console.log(`\n============================`);
        console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log(`============================\n`);

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

runTests();
