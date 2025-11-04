# Quiz Battle - AI-Powered Multiplayer Quiz Game

A beautiful, space-themed multiplayer quiz game with AI-generated questions powered by Claude (Anthropic).

## Features

- 🎮 **2-6 Players**: Multiplayer quiz battles
- 🤖 **AI Quiz Generation**: Generate custom quizzes on any topic using Claude
- 📄 **CSV Import**: Upload your own quiz questions
- 🎨 **Beautiful UI**: Glassmorphism design with space theme
- 🎉 **Interactive Effects**: Confetti, shake animations, and visual feedback
- 📊 **Score Tracking**: Round-by-round scoring with final standings

## Setup

### Environment Variables

This app requires the Anthropic API key to generate quizzes with AI.

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. In Netlify:
   - Go to **Site Configuration** → **Environment Variables**
   - Add: `ANTHROPIC_API_KEY` = `your_api_key_here`

### Local Development

```bash
# Install dependencies
npm install

# Run locally with Netlify Dev (simulates serverless functions)
npm run dev
```

## How to Use

### Starting a Game

1. **Select Players**: Choose 2-6 players
2. **Player Setup**: Enter names and choose emoji avatars
3. **Generate Quiz**: 
   - **Option A**: Enter a topic (e.g., "Australian Animals") and click "Generate Quiz" to use AI
   - **Option B**: Upload your own CSV file with questions

### CSV Format

If you prefer to upload your own questions, use this CSV format:

```csv
Topic,Question,Option A,Option B,Option C,Option D,Correct Answer
Australian Animals,What is the fastest land animal in Australia?,Kangaroo,Emu,Dingo,Wombat,B
Space,What is the largest planet in our solar system?,Mars,Jupiter,Saturn,Neptune,B
```

- **Topic**: Category or theme
- **Question**: The question text
- **Options A-D**: Four answer choices
- **Correct Answer**: Letter (A, B, C, or D)

### Multi-Round Games

You can include multiple topics in one CSV file, and each topic will become a separate round:

```csv
Topic,Question,Option A,Option B,Option C,Option D,Correct Answer
Australian Animals,Question 1...,A,B,C,D,A
Australian Animals,Question 2...,A,B,C,D,C
Space,Question 1...,A,B,C,D,B
Space,Question 2...,A,B,C,D,D
```

This CSV would create 2 rounds: one for Australian Animals, one for Space.

## Testing on Netlify

After deploying to Netlify:

1. **Verify Environment Variable**: 
   - Go to Site Configuration → Environment Variables
   - Confirm `ANTHROPIC_API_KEY` is set

2. **Test AI Generation**:
   - Start a game
   - Enter a topic (e.g., "Space Exploration")
   - Click "Generate Quiz"
   - Wait for Claude to generate questions (~5-10 seconds)
   - The quiz will automatically load

3. **Check Function Logs** (if issues occur):
   - Go to Netlify dashboard → Functions → generateQuiz
   - View logs to see any errors

## Technical Details

### Netlify Functions

The AI quiz generation is handled by a serverless function at `netlify/functions/generateQuiz.js`:
- Receives topic and number of questions
- Calls Anthropic API with Claude Sonnet 4
- Returns properly formatted CSV
- Error handling for API failures

### Security

- ✅ API key stored in environment variables (not in code)
- ✅ Server-side API calls (key never exposed to client)
- ✅ Input validation and error handling

## Credits

Built with vanilla HTML, CSS, and JavaScript. AI quiz generation powered by Claude (Anthropic).

## License

MIT

