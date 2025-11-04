exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topic, numberOfQuestions = 10, difficulty = 'Medium' } = JSON.parse(event.body);

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
        model: 'claude-3-5-haiku-20241022',  // Fast, cheap, and great for structured tasks
        max_tokens: 2048,  // Reduced from 4096 - still plenty for quiz generation
        messages: [{
          role: 'user',
          content: `Generate a quiz CSV file with exactly ${numberOfQuestions} multiple-choice questions about "${topic}" at ${difficulty} difficulty level.

=== CSV FORMAT REQUIREMENTS ===

The CSV file must follow this exact format:
- Header row: Topic,Question,Answer1,Answer2,Answer3,Answer4,CorrectAnswer
- Each data row contains: topic name, question text, four answer options, and the correct answer text
- The CorrectAnswer field must EXACTLY match one of the four answer options (Answer1-4) - same text, same capitalization, same punctuation
- All text fields should be enclosed in quotes if they contain commas
- Each question must have exactly 4 answer options
- Questions should be clear, unambiguous, and have only one correct answer

=== QUALITY GUIDELINES ===

Difficulty Level: ${difficulty}
${difficulty === 'Easy' ? '- Use straightforward questions that test basic knowledge\n- Avoid obscure facts or complex reasoning' : ''}
${difficulty === 'Medium' ? '- Use questions that require moderate knowledge\n- Mix factual recall with some reasoning' : ''}
${difficulty === 'Hard' ? '- Use challenging questions that test deeper knowledge\n- Include questions requiring analysis or specialized knowledge' : ''}

QUESTION QUALITY:
- Questions should be clear and unambiguous
- Avoid trick questions or questions with multiple valid answers
- Mix different question types (facts, identification, comparison, etc.)

ANSWER OPTIONS:
- All four options should be plausible
- Avoid obvious incorrect answers
- Similar length and format for all options
- Randomize which answer position (1-4) contains the correct answer (don't always put correct answer in same position)

CRITICAL: The CorrectAnswer field must EXACTLY match one of Answer1, Answer2, Answer3, or Answer4 - character for character, including capitalization and punctuation.

IMPORTANT: Output ONLY the CSV content with no introduction, explanation, or markdown code blocks. Start directly with the header row.

Example format:
Topic,Question,Answer1,Answer2,Answer3,Answer4,CorrectAnswer
"${topic}","What is the largest planet in our solar system?","Mars","Jupiter","Saturn","Neptune","Jupiter"
"${topic}","How many moons does Earth have?","1","2","3","0","1"`
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

