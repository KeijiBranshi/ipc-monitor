const fs = require("fs-extra");
const tsConfig = require("./tsconfig.base.json");
const pkg = require("./package.json");

// copy dist & types to package folder
fs.copySync("./dist", "./package");
fs.copySync("./types", "./package");

// Copy tsconfig (for path aliasing)
delete tsConfig.exclude;
fs.writeJsonSync("./package/tsconfig.json", tsConfig, { spaces: 2, EOL: "\n" });

// create modified package.json
delete pkg.scripts;
delete pkg.types;
pkg.types = "index.d.ts";

fs.writeJsonSync("./package/package.json", pkg, { spaces: 2, EOL: "\n" });

// copy LICENSE
fs.copySync("./LICENSE", "./package/LICENSE");
