/* Single source of truth for the externally hosted AI chatbot's URL.
   The chatbot is a separate project (Streamlit + LangGraph + RAG) with
   its own deployment -- this portfolio only ever links to it, never
   embeds or calls it. Set this one value once the chatbot has a live
   URL; nothing else in the portfolio needs to change. */
const CHATBOT_URL = "";

/* Optional link to a hosted resume/CV. Same convention as CHATBOT_URL:
   leave empty until a URL exists -- the Resume button stays visible but
   inert instead of navigating to "#". */
const RESUME_URL = "";
