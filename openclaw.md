
Why is ts even useful

I think the main hype of these things is that it's the first time some ppl have access to the combo of llms & apis & cron jobs who can't/won't code. Otherwise you can get most of this functionality with a hosted app with basic openai toolcall loop and api integrations.

The tradeoff for the developer is that openclaw provides well-refined tool-calling (refined tool definition text) and extra loop heuristics to execute toolcalling/reprompting slightly more effectively than a default loop, but openclaw gives you less flexibility in large orchestration flows where data from one completed prompt (after all toolcalling) to another.

*Basically: more refined intra-prompt tool-calling loop but less flexible inter-prompting when you have orchestration involving more than 1 llm response. And it can adapt better from one cron job to the next with explicit memory files rather than relying on querying the right context from the codebase w/ codex.

Other info

Good video about vector speedups, good heartbeat prompt, prompt for switching models, etc:
• https://www.youtube.com/watch?v=vte-fDoZczE&t=2797s

Things I could look into next:
• Configure Twilio so it can send texts (website down rn?)
• Mac mini: for always-on functionality
• Video above: prompt to switch models, etc.
• Integration to send a text to me
• Look through more open source skills @ https://clawhub.ai/skills?sort=downloads&nonSuspicious=true 











