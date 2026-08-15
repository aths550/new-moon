import { i as __toESM } from "./rolldown-runtime-CoDluQUr.js";
import { t as require_react } from "./react-CG4JYB8F.js";
import { B as createTheme, G as Global, U as internal_serializeStyles, Y as ThemeContext, dt as require_prop_types, n as identifier_default, r as defaultTheme, t as useDefaultProps } from "./DefaultPropsProvider-C3xmMdYG.js";
import { t as require_jsx_runtime } from "./jsx-runtime-Q7cvWsLl.js";
//#region ../node_modules/@mui/styled-engine/GlobalStyles/GlobalStyles.mjs
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types(), 1);
var import_jsx_runtime = require_jsx_runtime();
function isEmpty(obj) {
	return obj === void 0 || obj === null || Object.keys(obj).length === 0;
}
function GlobalStyles$3(props) {
	const { styles, defaultTheme = {} } = props;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(Global, { styles: typeof styles === "function" ? (themeInput) => styles(isEmpty(themeInput) ? defaultTheme : themeInput) : styles });
}
GlobalStyles$3.propTypes = {
	defaultTheme: import_prop_types.default.object,
	styles: import_prop_types.default.oneOfType([
		import_prop_types.default.array,
		import_prop_types.default.string,
		import_prop_types.default.object,
		import_prop_types.default.func
	])
};
//#endregion
//#region ../node_modules/@mui/system/useThemeWithoutDefault/useThemeWithoutDefault.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function isObjectEmpty(obj) {
	return Object.keys(obj).length === 0;
}
function useThemeWithoutDefault(defaultTheme = null) {
	const contextTheme = import_react.useContext(ThemeContext);
	return !contextTheme || isObjectEmpty(contextTheme) ? defaultTheme : contextTheme;
}
//#endregion
//#region ../node_modules/@mui/system/useTheme/useTheme.mjs
var systemDefaultTheme = createTheme();
function useTheme(defaultTheme = systemDefaultTheme) {
	return useThemeWithoutDefault(defaultTheme);
}
//#endregion
//#region ../node_modules/@mui/system/GlobalStyles/GlobalStyles.mjs
function wrapGlobalLayer(styles) {
	const serialized = internal_serializeStyles(styles);
	if (styles !== serialized && serialized.styles) {
		if (!serialized.styles.match(/^@layer\s+[^{]*$/)) serialized.styles = `@layer global{${serialized.styles}}`;
		return serialized;
	}
	return styles;
}
function GlobalStyles$2({ styles, themeId, defaultTheme = {} }) {
	const upperTheme = useTheme(defaultTheme);
	const resolvedTheme = themeId ? upperTheme[themeId] || upperTheme : upperTheme;
	let globalStyles = typeof styles === "function" ? styles(resolvedTheme) : styles;
	if (resolvedTheme.modularCssLayers) {
		if (Array.isArray(globalStyles)) globalStyles = globalStyles.map((styleArg) => {
			if (typeof styleArg === "function") return wrapGlobalLayer(styleArg(resolvedTheme));
			return wrapGlobalLayer(styleArg);
		});
		else globalStyles = wrapGlobalLayer(globalStyles);
	}
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles$3, { styles: globalStyles });
}
GlobalStyles$2.propTypes = {
	/**
	* @ignore
	*/
	defaultTheme: import_prop_types.default.object,
	/**
	* @ignore
	*/
	styles: import_prop_types.default.oneOfType([
		import_prop_types.default.array,
		import_prop_types.default.func,
		import_prop_types.default.number,
		import_prop_types.default.object,
		import_prop_types.default.string,
		import_prop_types.default.bool
	]),
	/**
	* @ignore
	*/
	themeId: import_prop_types.default.string
};
//#endregion
//#region ../node_modules/@mui/material/GlobalStyles/GlobalStyles.mjs
function GlobalStyles$1(props) {
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles$2, {
		...props,
		defaultTheme,
		themeId: identifier_default
	});
}
GlobalStyles$1.propTypes = { 
/**
* The styles you want to apply globally.
*/
styles: import_prop_types.default.oneOfType([
	import_prop_types.default.array,
	import_prop_types.default.func,
	import_prop_types.default.number,
	import_prop_types.default.object,
	import_prop_types.default.string,
	import_prop_types.default.bool
]) };
//#endregion
//#region ../node_modules/@mui/material/zero-styled/index.mjs
function globalCss(styles) {
	return function GlobalStylesWrapper(props) {
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles$1, { styles: typeof styles === "function" ? (theme) => styles({
			theme,
			...props
		}) : styles });
	};
}
//#endregion
//#region ../node_modules/@mui/material/CssBaseline/CssBaseline.mjs
var isDynamicSupport = typeof globalCss({}) === "function";
var html = (theme, enableColorScheme) => ({
	WebkitFontSmoothing: "antialiased",
	MozOsxFontSmoothing: "grayscale",
	boxSizing: "border-box",
	WebkitTextSizeAdjust: "100%",
	...enableColorScheme && !theme.vars && { colorScheme: theme.palette.mode }
});
var body = (theme) => ({
	color: (theme.vars || theme).palette.text.primary,
	...theme.typography.body1,
	backgroundColor: (theme.vars || theme).palette.background.default,
	"@media print": { backgroundColor: (theme.vars || theme).palette.common.white }
});
var styles = (theme, enableColorScheme = false) => {
	const colorSchemeStyles = {};
	if (enableColorScheme && theme.colorSchemes && typeof theme.getColorSchemeSelector === "function") Object.entries(theme.colorSchemes).forEach(([key, scheme]) => {
		const selector = theme.getColorSchemeSelector(key);
		if (selector.startsWith("@")) colorSchemeStyles[selector] = { ":root": { colorScheme: scheme.palette?.mode } };
		else colorSchemeStyles[selector.replace(/\s*&/, "")] = { colorScheme: scheme.palette?.mode };
	});
	let defaultStyles = {
		html: html(theme, enableColorScheme),
		"*, *::before, *::after": { boxSizing: "inherit" },
		"strong, b": { fontWeight: theme.typography.fontWeightBold },
		body: {
			margin: 0,
			...body(theme),
			"&::backdrop": { backgroundColor: (theme.vars || theme).palette.background.default }
		},
		...colorSchemeStyles
	};
	const themeOverrides = theme.components?.MuiCssBaseline?.styleOverrides;
	if (themeOverrides) defaultStyles = [defaultStyles, themeOverrides];
	return defaultStyles;
};
var SELECTOR = "mui-ecs";
var staticStyles = (theme) => {
	const result = styles(theme, false);
	const baseStyles = Array.isArray(result) ? result[0] : result;
	if (!theme.vars && baseStyles) baseStyles.html[`:root:has(${SELECTOR})`] = { colorScheme: theme.palette.mode };
	if (theme.colorSchemes) Object.entries(theme.colorSchemes).forEach(([key, scheme]) => {
		const selector = theme.getColorSchemeSelector(key);
		if (selector.startsWith("@")) baseStyles[selector] = { [`:root:not(:has(.${SELECTOR}))`]: { colorScheme: scheme.palette?.mode } };
		else baseStyles[selector.replace(/\s*&/, "")] = { [`&:not(:has(.${SELECTOR}))`]: { colorScheme: scheme.palette?.mode } };
	});
	return result;
};
var GlobalStyles = globalCss(isDynamicSupport ? ({ theme, enableColorScheme }) => styles(theme, enableColorScheme) : ({ theme }) => staticStyles(theme));
/**
* Kickstart an elegant, consistent, and simple baseline to build upon.
*/
function CssBaseline(inProps) {
	const { children, enableColorScheme = false } = useDefaultProps({
		props: inProps,
		name: "MuiCssBaseline"
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
		isDynamicSupport && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles, { enableColorScheme }),
		!isDynamicSupport && !enableColorScheme && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
			className: SELECTOR,
			style: { display: "none" }
		}),
		children
	] });
}
CssBaseline.propTypes = {
	/**
	* You can wrap a node.
	*/
	children: import_prop_types.default.node,
	/**
	* Enable `color-scheme` CSS property to use `theme.palette.mode`.
	* For more details, check out https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme
	* For browser support, check out https://caniuse.com/?search=color-scheme
	* @default false
	*/
	enableColorScheme: import_prop_types.default.bool
};
//#endregion
export { GlobalStyles$1 as a, useThemeWithoutDefault as c, globalCss as i, GlobalStyles$3 as l, body as n, GlobalStyles$2 as o, html as r, useTheme as s, CssBaseline as t };
