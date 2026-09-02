const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function copyIfMissing(relSrc, relDest) {
  const src = path.join(root, relSrc);
  const dest = path.join(root, relDest);

  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[RateHub] Auto-created ${relDest} from template.`);
  }
}

copyIfMissing('apps/api/.env.example', 'apps/api/.env');
copyIfMissing('apps/web/.env.example', 'apps/web/.env');
