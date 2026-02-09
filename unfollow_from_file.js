const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function startUnfollowing() {
    let browser; // Declared here so 'finally' can access it
    
    try {
        const folderPath = path.join(os.homedir(), 'Downloads', 'unfollow');
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
            throw new Error("No JSON files found in Downloads/unfollow");
        }
        
        const latestFile = files.sort().reverse()[0];
        const usernames = JSON.parse(fs.readFileSync(path.join(folderPath, latestFile)));
        console.log(`📖 Loaded ${usernames.length} targets.`);

        browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://www.instagram.com/accounts/login/');
        console.log("🔓 LOG IN MANUALLY.");
        
        // This is a high-risk line for manual closures
        await page.waitForSelector('svg[aria-label="Home"], svg[aria-label="Direct Messages"]', { timeout: 0 });

        let successCount = 0;

        for (const user of usernames) {
            try {
                console.log(`\n🎯 User: ${user}`);
                await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(3000);

                const relationshipBtn = page.locator('button').filter({ 
                    hasText: /Following|Friends|Requested|followed/i 
                }).first();

                const isFollowing = await relationshipBtn.isVisible({ timeout: 2000 });
                
                if (isFollowing) {
                    await relationshipBtn.click();
                    await page.waitForTimeout(1500);

                    const dialog = page.locator('div[role="dialog"]');
                    const confirmBtn = dialog.locator('button, span').filter({ hasText: /^Unfollow$/i }).first();

                    if (await confirmBtn.isVisible({ timeout: 2000 })) {
                        await confirmBtn.click();
                        successCount++;
                        console.log(`   ✅ Success: Unfollowed.`);
                    } else {
                        await page.mouse.click(600, 400); 
                    }

                    const wait = Math.floor(Math.random() * 5000) + 5000;
                    await page.waitForTimeout(wait);
                }
            } catch (innerError) {
                // This catch handles errors for A SINGLE USER, so the loop continues
                console.log(`   ⚠️ Skipping ${user}: Element not found or page changed.`);
            }
        }

        return { totalProcessed: usernames.length, successCount: successCount };

    } catch (error) {
        // This catch handles the BIG stuff (like closing the browser)
        if (error.message.includes('closed') || error.message.includes('Target page')) {
            throw new Error("Browser was closed manually. Unfollowing stopped.");
        }
        throw error;

    } finally {
        if (browser) {
            await browser.close().catch(() => {});
            console.log("🧹 Browser process cleaned up.");
        }
    }
}

module.exports = { startUnfollowing };