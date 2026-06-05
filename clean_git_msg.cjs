const fs = require('fs');
let msg = fs.readFileSync(0, 'utf-8');
msg = msg.replace(/^.*Co-Authored-By:.*Claude.*$\n?/gim, '');
console.log(msg);
