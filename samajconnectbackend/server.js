require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║          SamajConnect Backend Server              ║
  ║───────────────────────────────────────────────────║
  ║  Status:      Running                            ║
  ║  Port:        ${String(PORT).padEnd(36)}║
  ║  Environment: ${String(process.env.NODE_ENV || "development").padEnd(36)}║
  ║  City:        ${String(process.env.DEFAULT_CITY || "Latur").padEnd(36)}║
  ╚═══════════════════════════════════════════════════╝
  `);
});
