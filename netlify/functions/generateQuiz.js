exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topic, numberOfQuestions = 10 } = JSON.parse(event.body);

    if (!topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic is required' })
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Generate a quiz CSV file with exactly ${numberOfQuestions} multiple-choice questions about "${topic}".

Format requirements:
- Each row should have: Topic,Question,Option A,Option B,Option C,Option D,Correct Answer
- Topic should be: ${topic}
- Include exactly 4 answer options (A, B, C, D) for each question
- The Correct Answer column should contain ONLY the letter (A, B, C, or D)
- Questions should be challenging but fair
- Ensure variety in which option is correct (don't always make A or D correct)
- Make questions interesting and educational

IMPORTANT: Output ONLY the CSV content with no introduction, explanation, or markdown formatting. Start directly with the header row.

Example format:
Topic,Question,Option A,Option B,Option C,Option D,Correct Answer
${topic},What is...?,Answer 1,Answer 2,Answer 3,Answer 4,B`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Failed to generate quiz',
          details: errorData
        })
      };
    }

    const data = await response.json();
    let csvContent = data.content[0].text.trim();
    
    // Clean up the response - remove any markdown code blocks if present
    csvContent = csvContent.replace(/```csv\n?/g, '').replace(/```\n?/g, '').trim();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
      },
      body: JSON.stringify({ 
        csv: csvContent,
        topic: topic,
        questionCount: numberOfQuestions
      })
    };

  } catch (error) {
    console.error('Error generating quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

