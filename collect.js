const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function startCollection() {
    let browser; // Define browser outside so 'finally' can see it
    
    try {
        browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://www.instagram.com/accounts/login/');
        console.log("🔓 1. LOGIN MANUALLY.");
        console.log("🔓 2. GO TO YOUR PROFILE PAGE.");
        
        // This is where it usually 'fails' if you close the browser
        await page.waitForSelector('header section', { timeout: 0 });
        console.log("✅ Profile detected!");

        async function scrapeList(type) {
            console.log(`📂 Opening ${type}...`);
            await page.click(`a[href*="/${type}/"]`);
            await page.waitForSelector('div[role="dialog"]');
            await page.waitForTimeout(2000);

            const listSet = new Set();
            let lastCount = 0;
            let noNewDataTicks = 0;

            while (noNewDataTicks < 15) {
                const users = await page.evaluate(() => {
                    const results = [];
                    const items = document.querySelectorAll('div[role="dialog"] a[role="link"]');
                    items.forEach(item => {
                        const name = item.innerText.split('\n')[0].trim();
                        if (name && name.length > 1 && !["Follow", "Following", "Requested"].includes(name)) {
                            results.push(name);
                        }
                    });
                    return results;
                });

                users.forEach(u => listSet.add(u));
                if (listSet.size > lastCount) {
                    lastCount = listSet.size;
                    noNewDataTicks = 0;
                } else {
                    noNewDataTicks++;
                }

                await page.evaluate(() => {
                    const dialog = document.querySelector('div[role="dialog"]');
                    const allDivs = dialog.querySelectorAll('div');
                    for (let div of allDivs) {
                        if (div.scrollHeight > div.clientHeight) {
                            div.scrollTop += 1000;
                        }
                    }
                });
                await page.waitForTimeout(1500);
            }

            await page.keyboard.press('Escape');
            await page.waitForTimeout(2000);
            return Array.from(listSet);
        }

        const followers = await scrapeList('followers');
        const following = await scrapeList('following');

        const nonFollowers = following.filter(u => !followers.includes(u));
        const downloadDir = path.join(os.homedir(), 'Downloads', 'unfollow');
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        const filePath = path.join(downloadDir, `non_followers_${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify(nonFollowers, null, 2));
        
        return { count: nonFollowers.length, path: filePath };

    } catch (error) {
        // --- ERROR HANDLING ---
        console.log("❌ Task Interrupted");
        
        // If the error message mentions 'closed' or 'target', it's a manual exit
        if (error.message.includes('closed') || error.message.includes('Target page')) {
            throw new Error("Browser was closed manually. Process stopped.");
        }
        
        // Otherwise, throw whatever the actual error was
        throw error;

    } finally {
        // --- CLEANUP ---
        if (browser) {
            await browser.close().catch(() => {}); // Close browser if it exists
            console.log("🧹 Browser resources cleaned up.");
        }
    }
}

module.exports = { startCollection };