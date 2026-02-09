const express = require('express');
const { startCollection } = require('./collect');
const { startUnfollowing } = require('./unfollow_from_file');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.use(express.static('public'));

// 🛡️ Safety Wrapper: This prevents the server from hanging if an async task fails
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Route 1: Collect (Wrapped in safety)
app.get('/run-collect', asyncHandler(async (req, res) => {
    const result = await startCollection();
    res.send(`Success! Found ${result.count} non-followers.`);
}));

// Route 2: Unfollow (Wrapped in safety)
app.get('/run-unfollow', asyncHandler(async (req, res) => {
    const result = await startUnfollowing();
    res.send(`Done! Processed ${result.totalProcessed} and unfollowed ${result.successCount}.`);
}));

// 🚨 GLOBAL ERROR HANDLER
// This is the "Safety Net." If any code above fails (like closing the browser), 
// this function catches it and sends a clean message to your web dashboard.
app.use((err, req, res, next) => {
    console.error("❌ Automation Error:", err.message);
    res.status(500).send(err.message || "The robot lost its connection to the browser.");
});

app.listen(port, () => {
    console.log(`✅ App live at http://localhost:${port}`);
    exec(`start http://localhost:${port}`);
});