/* Single source of truth for the externally hosted AI chatbot's URL.
   The chatbot is a separate project (Streamlit + LangGraph + RAG) with
   its own deployment -- this portfolio only ever links to it, never
   embeds or calls it. Set this one value once the chatbot has a live
   URL; nothing else in the portfolio needs to change. */
const CHATBOT_URL = "";
