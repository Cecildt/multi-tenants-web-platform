import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/main.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [typescript()],
};

// export default [
// 	// browser-friendly UMD build
// 	{
// 		input: 'src/main.ts',
// 		output: {
// 			name: 'tenants-db-lib',
// 			file: pkg.browser,
// 			format: 'umd'
// 		},
// 		plugins: [
// 			resolve(), // so Rollup can find `ms`
// 			commonjs(), // so Rollup can convert `ms` to an ES module
//             typescript() // so Rollup can convert TypeScript to JavaScript
// 		]
// 	},

// 	// CommonJS (for Node) and ES module (for bundlers) build.
// 	// (We could have three entries in the configuration array
// 	// instead of two, but it's quicker to generate multiple
// 	// builds from a single configuration where possible, using
// 	// an array for the `output` option, where we can specify
// 	// `file` and `format` for each target)
// 	{
// 		input: 'src/main.ts',
// 		external: [],
// 		output: [
// 			{ file: pkg.main, format: 'cjs' },
// 			{ file: pkg.module, format: 'es' }
// 		]
// 	}
// ];
