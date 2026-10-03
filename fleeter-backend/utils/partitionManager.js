const pool = require("../config/db");

async function ensurePartitionsExist() {
  try {
    const now = new Date();
    
    // Create partitions for the current month and the next 2 months
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const partitionName = `telemetry_y${year}m${month}`;
      
      // Format as YYYY-MM-DD 00:00:00Z
      const startDateStr = `${year}-${month}-01 00:00:00Z`;
      
      const nextYear = nextDate.getFullYear();
      const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
      const endDateStr = `${nextYear}-${nextMonth}-01 00:00:00Z`;

      const query = `
        CREATE TABLE IF NOT EXISTS ${partitionName} 
        PARTITION OF Vehicle_Telemetry 
        FOR VALUES FROM ('${startDateStr}') TO ('${endDateStr}');
      `;
      
      await pool.query(query);
    }
    console.log("✅ Auto-partitioning check complete.");
  } catch (error) {
    console.error("⚠️ Failed to auto-create time-series partitions:", error.message);
  }
}

module.exports = ensurePartitionsExist;
