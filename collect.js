const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/accounts/login/');
    console.log("🔓 1. LOGIN MANUALLY.");
    console.log("🔓 2. GO TO YOUR PROFILE PAGE.");
    
    await page.waitForSelector('header section', { timeout: 0 });
    console.log("✅ Profile detected! Let's get to work.");

    async function scrapeList(type) {
        console.log(`📂 Opening ${type}...`);
        await page.click(`a[href*="/${type}/"]`);
        await page.waitForSelector('div[role="dialog"]');
        await page.waitForTimeout(2000);

        const listSet = new Set();
        let lastCount = 0;
        let noNewDataTicks = 0;

        while (noNewDataTicks < 15) {
            // 1. Capture names
            const users = await page.evaluate(() => {
                const results = [];
                // Look for all links that look like usernames
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
                console.log(`📡 Captured ${listSet.size} ${type}...`);
                lastCount = listSet.size;
                noNewDataTicks = 0;
            } else {
                noNewDataTicks++;
            }

            // 2. FORCE SCROLL (The Brute Force Way)
            await page.evaluate(() => {
                // Find the dialog
                const dialog = document.querySelector('div[role="dialog"]');
                // Find all divs inside that have scrollbars
                const allDivs = dialog.querySelectorAll('div');
                for (let div of allDivs) {
                    if (div.scrollHeight > div.clientHeight) {
                        div.scrollTop += 1000; // Jump down
                        div.style.border = "2px solid red"; // Visual confirmation
                    }
                }
            });

            await page.waitForTimeout(1500);
        }

        console.log(`✔️ Finished ${type}.`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(2000);
        return Array.from(listSet);
    }

    const followers = await scrapeList('followers');
    await page.waitForTimeout(2000);
    const following = await scrapeList('following');

    const nonFollowers = following.filter(u => !followers.includes(u));

    const downloadDir = path.join(os.homedir(), 'Downloads', 'unfollow');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const filePath = path.join(downloadDir, `non_followers_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(nonFollowers, null, 2));
    
    console.log(`\n✅ ALL DONE!`);
    console.log(`💔 Non-Followers Found: ${nonFollowers.length}`);
    console.log(`📂 Saved to: ${filePath}`);
    await browser.close();
})();