// Ensures the server starts reliably even when NODE_OPTIONS contains flags like
// `--watch` which can crash on Windows file events that provide a null filename.
//
// This script mirrors `node -r dotenv/config server.js` without relying on
// Node's watch mode.

process.env.NODE_OPTIONS = "";

const dotenvPath =
  process.env.dotenv_config_path ||
  process.env.DOTENV_CONFIG_PATH ||
  process.env.DOTENV_CONFIG_FILE;

// Keep behavior close to `-r dotenv/config`:
// - load `.env` by default
// - respect an explicit path via env var
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const dotenv = require("dotenv");
  dotenv.config(dotenvPath ? { path: dotenvPath } : undefined);
} catch {
  // If dotenv isn't available for some reason, continue and let the app fail
  // with its own error message when it reads missing env vars.
}

require("../server.js");

