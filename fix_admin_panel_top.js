const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');
const top = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LifeBuoy,
`;
fs.writeFileSync('src/components/admin/AdminPanel.tsx', top + code);
