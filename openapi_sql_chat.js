const readline = require('readline');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// --- Set your OpenAI API key ---
const apiKey = process.env.OPENAI_API_KEY || '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';
if (!apiKey) {
    console.error('Please set the OPENAI_API_KEY environment variable.');
    process.exit(1);
}
const openai = new OpenAI({ apiKey });

// --- Set your Supabase credentials ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://uxnofczrtlbiihbxqgpk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bm9mY3pydGxiaWloYnhxZ3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDE3NzcsImV4cCI6MjA2ODc3Nzc3N30.YmNlt2sECH-Lzyi524YWub9B1ol42AvAceeAeVGUAn8';
if (!supabaseUrl || !supabaseKey) {
    console.error('Please set the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function getSupabaseQueryFromText(prompt) {
    const systemPrompt = `
You are an assistant that converts natural language into JavaScript code using the Supabase client from @supabase/supabase-js.
Only return the code that performs the Supabase query. Do not include explanations.
Use async/await, and assume 'supabase' is already defined.
`;
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        max_tokens: 256,
        temperature: 0,
    });

    return response.choices[0].message.content.trim();
}
function cleanCodeBlock(code) {
    return code.replace(/```(javascript|js)?/gi, '').trim();
}

function ensureReturnStatement(code) {
    // Only add 'return data;' if it looks like a Supabase call that fetches data
    if (!/return\s+data\s*;/.test(code)) {
        return code + '\nreturn data;';
    }
    return code;
}

async function executeSupabaseQuery(queryCode) {
    try {
        console.log('➡️ Raw query code:', queryCode);

        const cleanedCode = ensureReturnStatement(cleanCodeBlock(queryCode));
        console.log('🧼 Final cleaned and ensured code:\n', cleanedCode);

        // Dynamically execute the cleaned code
        const func = new Function('supabase', `return (async () => { ${cleanedCode} })();`);
        const result = await func(supabase);

        console.log('✅ Result:', result);
        return result;
    } catch (err) {
        console.error('❌ Error during Supabase execution:', err);
        throw err;
    }
}


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Describe your query: ', async (userInput) => {
    try {
        const generatedQuery = await getSupabaseQueryFromText(userInput);
        console.log('\nGenerated Supabase Query Code:\n', generatedQuery);

        rl.question('\nDo you want to execute this Supabase query? (yes/no): ', async (answer) => {
            if (answer.trim().toLowerCase() === 'yes') {
                try {
                    const result = await executeSupabaseQuery(generatedQuery);
                    console.log('\nQuery Result:\n', result);
                } catch (err) {
                    console.error('\nSupabase Query Error:', err.message || err);
                }
            } else {
                console.log('\nQuery not executed.');
            }
            rl.close();
        });
    } catch (err) {
        console.error('\nError:', err.message);
        rl.close();
    }
});
