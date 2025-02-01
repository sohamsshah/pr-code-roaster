import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
import { Octokit } from 'octokit';

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const ROAST_PROMPT = `You are a sarcastic code reviewer with a sharp wit and deep technical knowledge. 
Your task is to analyze the given code and provide humorous, witty, and sarcastic comments about:
- Code style and formatting
- Potential bugs or issues
- Architectural decisions
- Naming conventions
- Any obvious anti-patterns

Be creative and funny, but also technically accurate. Your comments should be both entertaining and educational.
Make references to common programming memes and jokes when relevant.

Example response style:
"Ah yes, nothing says 'I love nested callbacks' like this beautiful pyramid of doom. 
I see you're also a fan of variable names that could win a 'most cryptic' contest."

Keep responses concise but impactful. Each roast should be 2-3 sentences maximum.`;

async function extractPRDetails(prUrl) {
    try {
        // Extract owner, repo, and PR number from URL
        const urlParts = prUrl.split('/');
        const prNumber = parseInt(urlParts[urlParts.length - 1]);
        const repo = urlParts[urlParts.length - 3];
        const owner = urlParts[urlParts.length - 4];

        return { owner, repo, prNumber };
    } catch (error) {
        throw new Error('Invalid PR URL format');
    }
}

async function getPRFiles(owner, repo, prNumber) {
    try {
        const { data: files } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
        });

        return files.map(file => ({
            filename: file.filename,
            patch: file.patch || '',
            additions: file.additions,
            deletions: file.deletions,
        }));
    } catch (error) {
        console.error('Error fetching PR files:', error);
        throw error;
    }
}

async function roastCode(code) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: ROAST_PROMPT },
                { role: "user", content: code }
            ],
            temperature: 0.8,
            max_tokens: 150
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error roasting code:', error);
        throw error;
    }
}

async function generateRoastDocument(files) {
    let roastDocument = '# 🔥 Code Roast Report 🔥\n\n';
    
    for (const file of files) {
        if (!file.patch) continue;
        
        roastDocument += `## ${file.filename}\n`;
        roastDocument += `Changes: +${file.additions} -${file.deletions}\n\n`;
        
        const roast = await roastCode(file.patch);
        roastDocument += `### Roast:\n${roast}\n\n`;
        roastDocument += `\`\`\`diff\n${file.patch}\n\`\`\`\n\n`;
        roastDocument += '---\n\n';
    }
    
    return roastDocument;
}

app.post('/roast', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'No code provided to roast' });
        }

        const roast = await roastCode(code);
        res.json({ roast });
    } catch (error) {
        res.status(500).json({ error: 'Failed to roast code' });
    }
});

app.post('/roast-pr', async (req, res) => {
    try {
        const { prUrl } = req.body;
        if (!prUrl) {
            return res.status(400).json({ error: 'No PR URL provided' });
        }

        const { owner, repo, prNumber } = await extractPRDetails(prUrl);
        const files = await getPRFiles(owner, repo, prNumber);
        const roastDocument = await generateRoastDocument(files);

        res.json({ roastDocument });
    } catch (error) {
        console.error('Error processing PR:', error);
        res.status(500).json({ error: error.message || 'Failed to roast PR' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Code Roaster is ready to judge your code on port ${PORT} 🔥`);
});
