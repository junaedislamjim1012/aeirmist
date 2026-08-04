const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const search = `  useEffect(() => {
    if (user && profile && !profile.isVerified) {`;
const replace = `  const attemptedVerification = React.useRef(false);
  useEffect(() => {
    if (user && profile && !profile.isVerified && !attemptedVerification.current) {
      attemptedVerification.current = true;`;
fs.writeFileSync('src/App.tsx', code.replace(search, replace));
