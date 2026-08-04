const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');
code = code.replace("import {\n  LifeBuoy, motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
