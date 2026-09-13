const { spawn } = require("child_process");
const proc = spawn("Debugger/AITools/build/Core/Debug/aistudio_core_cli.exe", ["--mcp"], { cwd: process.cwd() });

let buf = "";

proc.on("error", (e) => {
  console.log("SPAWN ERROR:", e.message);
  process.exit(1);
});

proc.stdout.on("data", (d) => {
  buf += d.toString("utf8");
  let idx;
  while ((idx = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, idx);
    buf = buf.slice(idx + 1);
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 1) {
        const req = { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "symbol_search", arguments: { query: "Framework", max_results: 5 } } };
        proc.stdin.write(JSON.stringify(req) + "\n");
      } else if (msg.id === 2) {
        console.log("RESULT:", JSON.stringify(msg.result).slice(0, 800));
        proc.stdin.end();
        proc.kill();
        process.exit(0);
      }
    } catch (e) {
      console.log("PARSE ERROR:", e.message, line.slice(0, 200));
    }
  }
});

proc.stderr.on("data", (d) => console.log("STDERR:", d.toString()));

setTimeout(() => {
  console.log("TIMEOUT");
  proc.kill();
  process.exit(1);
}, 30000);

const req = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } } };
proc.stdin.write(JSON.stringify(req) + "\n");
