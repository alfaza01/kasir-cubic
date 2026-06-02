const fs = require('fs');

let code = fs.readFileSync('src/views/IsiSaldoView.tsx', 'utf8');

const regex = /\{wallets\.map\(w => <option key=\{w\} value=\{w\}>\{w\}<\/option>\)\}/g;
code = code.replace(regex, "{walletsFull.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}");

fs.writeFileSync('src/views/IsiSaldoView.tsx', code);
console.log("Replaced selections successfully.");
