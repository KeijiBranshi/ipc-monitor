import { eslint } from "rollup-plugin-eslint";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return (id) => pattern.test(id);
};

const external = makeExternalPredicate([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]);

export default [
  {
    input: "src/main/index.ts",
    output: {
      dir: "dist/main",
      format: "cjs",
      exports: "named",
    },
    external,
    plugins: [
      eslint({ throwOnError: true }),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
          },
        },
      }),
    ],
  },
  {
    input: "src/renderer/index.ts",
    output: {
      dir: "dist/renderer",
      format: "cjs",
      exports: "named",
    },
    external,
    plugins: [
      eslint({ throwOnError: true }),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
          },
        },
      }),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      dir: "dist",
      format: "cjs",
      preserveModules: true,
      exports: "named",
    },
    external,
    plugins: [
      eslint({ throwOnError: true }),
      typescript({
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
];
