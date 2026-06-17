import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const generateResult = async (prompt) => {
    try {
        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
            
            Examples: 
        
            <example>
            user:Create an express application 
            response: {
                "text": "this is you fileTree structure of the express server",
                "fileTree": {
                    "app.js": {
                        "file": {
                            "contents": "const express = require('express');\\n\\nconst app = express();\\n\\napp.get('/', (req, res) => {\\n    res.send('Hello World!');\\n});\\n\\napp.listen(3000, () => {\\n    console.log('Server is running on port 3000');\\n})"
                        }
                    },
                    "package.json": {
                        "file": {
                            "contents": "{\\n    \\\"name\\\": \\\"temp-server\\\",\\n    \\\"version\\\": \\\"1.0.0\\\",\\n    \\\"main\\\": \\\"index.js\\\",\\n    \\\"scripts\\\": {\\n        \\\"test\\\": \\\"echo \\\\\\\"Error: no test specified\\\\\\\" && exit 1\\\"\\n    },\\n    \\\"keywords\\\": [],\\n    \\\"author\\\": \\\"\\\",\\n    \\\"license\\\": \\\"ISC\\\",\\n    \\\"description\\\": \\\"\\\",\\n    \\\"dependencies\\\": {\\n        \\\"express\\\": \\\"^4.21.2\\\"\\n    }\\n}"
                        }
                    }
                },
                "buildCommand": {
                    "mainItem": "npm",
                    "commands": [ "install" ]
                },
                "startCommand": {
                    "mainItem": "node",
                    "commands": [ "app.js" ]
                }
            }
            </example>
        
            <example>
            user:Hello 
            response:{
               "text":"Hello, How can I help you today?"
            }
            </example>
            
            IMPORTANT : don't use file name like routes/index.js ie. i want to say do not give any directory`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            // Forces the model to return valid JSON output
            response_format: { type: "json_object" } 
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error generating completion:", error);
        throw error;
    }
};
