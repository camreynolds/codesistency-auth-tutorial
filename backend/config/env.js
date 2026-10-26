import dotenv from "dotenv";

// Load environment variables once, before any other module reads process.env.
// Using quiet: true to suppress the "injected env" logs from dotenv v18+.
dotenv.config({ quiet: true });