# Code Roaster 🔥

A fun Node.js application that uses OpenAI to provide sarcastic and witty comments about your code.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add your OpenAI API key:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and add your OpenAI API key

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Send a POST request to `/roast` with your code:
   ```bash
   curl -X POST http://localhost:3000/roast \
     -H "Content-Type: application/json" \
     -d '{"code": "function doStuff() { var a = 1; var b = 2; return a + b; }"}'
   ```

The API will return a JSON response with a sarcastic roast of your code!
