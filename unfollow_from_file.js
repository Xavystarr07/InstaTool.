const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
    const folderPath = path.join(os.homedir(), 'Downloads', 'unfollow');
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    if (files.length === 0) return console.log("❌ No JSON files found.");
    
    const latestFile = files.sort().reverse()[0];
    const usernames = JSON.parse(fs.readFileSync(path.join(folderPath, latestFile)));
    console.log(`📖 Loaded ${usernames.length} targets.`);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/accounts/login/');
    console.log("🔓 LOG IN MANUALLY. Script starts when you are on the Home Feed.");
    await page.waitForSelector('svg[aria-label="Home"], svg[aria-label="Direct Messages"]', { timeout: 0 });

    for (const user of usernames) {
        try {
            console.log(`\n🎯 User: ${user}`);
            await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            // 1. IMPROVED DETECTION: Check if we are actually following them
            // We look for buttons that indicate an existing relationship (Following, Friends, Requested)
            const relationshipBtn = page.locator('button').filter({ 
                hasText: /Following|Friends|Requested|followed/i 
            }).first();

            const isFollowing = await relationshipBtn.isVisible({ timeout: 2000 });
            
            if (isFollowing) {
                console.log(`   🔗 Status: Following. Attempting unfollow...`);
                await relationshipBtn.click();
                await page.waitForTimeout(1500);

                // 2. THE POPUP: Instagram now uses a specialized dialog
                // We look for the "Unfollow" text in red or standard within the dialog
                const dialog = page.locator('div[role="dialog"]');
                const confirmBtn = dialog.locator('button, span').filter({ hasText: /^Unfollow$/i }).first();

                if (await confirmBtn.isVisible({ timeout: 2000 })) {
                    await confirmBtn.click();
                    console.log(`   ✅ Success: Unfollowed.`);
                } else {
                    // Fallback: Sometimes it's just the first button in the popup
                    console.log(`   ⚠️ Exact text not found, trying fallback click...`);
                    await page.mouse.click(600, 400); // Clicking center-ish where popups usually live
                }

                // Safety Delay: 5-10 seconds
                const wait = Math.floor(Math.random() * 5000) + 5000;
                await page.waitForTimeout(wait);
            } else {
                // If we see a "Follow" or "Follow Back" button, we are NOT currently following them
                console.log(`   ⏭️ Skipping: Not following (Button says "Follow")`);
            }
        } catch (e) {
            console.log(`   ⚠️ Error: Couldn't process ${user}.`);
        }
    }
    console.log("\n🏁 Finished the list!");
    await browser.close();
})();