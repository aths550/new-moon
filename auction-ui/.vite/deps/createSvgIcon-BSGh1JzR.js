import { i as __toESM } from "./rolldown-runtime-CoDluQUr.js";
import { t as require_react } from "./react-CG4JYB8F.js";
import { B as createTheme, H as internal_mutateStyles, L as generateUtilityClass, Q as styleFunctionSx_default, R as clsx, U as internal_serializeStyles, W as styled$1, ct as require_react_is, dt as require_prop_types, lt as isObjectEmpty, n as identifier_default, r as defaultTheme, st as isPlainObject, t as useDefaultProps, ut as capitalize } from "./DefaultPropsProvider-C3xmMdYG.js";
import { t as require_jsx_runtime } from "./jsx-runtime-Q7cvWsLl.js";
//#region ../node_modules/@mui/utils/generateUtilityClasses/generateUtilityClasses.mjs
function generateUtilityClasses(componentName, slots, globalStatePrefix = "Mui") {
	const result = {};
	slots.forEach((slot) => {
		result[slot] = generateUtilityClass(componentName, slot, globalStatePrefix);
	});
	return result;
}
//#endregion
//#region ../node_modules/@mui/utils/getDisplayName/getDisplayName.mjs
var import_react_is = require_react_is();
function getFunctionComponentName(Component, fallback = "") {
	return Component.displayName || Component.name || fallback;
}
function getWrappedName(outerType, innerType, wrapperName) {
	const functionName = getFunctionComponentName(innerType);
	return outerType.displayName || (functionName !== "" ? `${wrapperName}(${functionName})` : wrapperName);
}
/**
* cherry-pick from
* https://github.com/react/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/shared/getComponentName.js
* originally forked from recompose/getDisplayName
*/
function getDisplayName(Component) {
	if (Component == null) return;
	if (typeof Component === "string") return Component;
	if (typeof Component === "function") return getFunctionComponentName(Component, "Component");
	if (typeof Component === "object") switch (Component.$$typeof) {
		case import_react_is.ForwardRef: return getWrappedName(Component, Component.render, "ForwardRef");
		case import_react_is.Memo: return getWrappedName(Component, Component.type, "memo");
		default: return;
	}
}
//#endregion
//#region ../node_modules/@mui/system/preprocessStyles.mjs
function preprocessStyles(input) {
	const { variants, ...style } = input;
	const result = {
		variants,
		style: internal_serializeStyles(style),
		isProcessed: true
	};
	if (result.style === style) return result;
	if (variants) variants.forEach((variant) => {
		if (typeof variant.style !== "function") variant.style = internal_serializeStyles(variant.style);
	});
	return result;
}
//#endregion
//#region ../node_modules/@mui/system/createStyled/createStyled.mjs
var systemDefaultTheme = createTheme();
function shouldForwardProp(prop) {
	return prop !== "ownerState" && prop !== "theme" && prop !== "sx" && prop !== "as";
}
function shallowLayer(serialized, layerName) {
	if (layerName && serialized && typeof serialized === "object" && serialized.styles && !serialized.styles.startsWith("@layer")) serialized.styles = `@layer ${layerName}{${String(serialized.styles)}}`;
	return serialized;
}
function defaultOverridesResolver(slot) {
	if (!slot) return null;
	return (_props, styles) => styles[slot];
}
function attachTheme(props, themeId, defaultTheme) {
	props.theme = isObjectEmpty(props.theme) ? defaultTheme : props.theme[themeId] || props.theme;
}
function processStyle(props, style, layerName) {
	const resolvedStyle = typeof style === "function" ? style(props) : style;
	if (Array.isArray(resolvedStyle)) return resolvedStyle.flatMap((subStyle) => processStyle(props, subStyle, layerName));
	if (Array.isArray(resolvedStyle?.variants)) {
		let rootStyle;
		if (resolvedStyle.isProcessed) rootStyle = layerName ? shallowLayer(resolvedStyle.style, layerName) : resolvedStyle.style;
		else {
			const { variants, ...otherStyles } = resolvedStyle;
			rootStyle = layerName ? shallowLayer(internal_serializeStyles(otherStyles), layerName) : otherStyles;
		}
		return processStyleVariants(props, resolvedStyle.variants, [rootStyle], layerName);
	}
	if (resolvedStyle?.isProcessed) return layerName ? shallowLayer(internal_serializeStyles(resolvedStyle.style), layerName) : resolvedStyle.style;
	return layerName ? shallowLayer(internal_serializeStyles(resolvedStyle), layerName) : resolvedStyle;
}
function processStyleVariants(props, variants, results = [], layerName = void 0) {
	let mergedState;
	variantLoop: for (let i = 0; i < variants.length; i += 1) {
		const variant = variants[i];
		if (typeof variant.props === "function") {
			mergedState ??= {
				...props,
				...props.ownerState,
				ownerState: props.ownerState
			};
			if (!variant.props(mergedState)) continue;
		} else for (const key in variant.props) if (props[key] !== variant.props[key] && props.ownerState?.[key] !== variant.props[key]) continue variantLoop;
		if (typeof variant.style === "function") {
			mergedState ??= {
				...props,
				...props.ownerState,
				ownerState: props.ownerState
			};
			results.push(layerName ? shallowLayer(internal_serializeStyles(variant.style(mergedState)), layerName) : variant.style(mergedState));
		} else results.push(layerName ? shallowLayer(internal_serializeStyles(variant.style), layerName) : variant.style);
	}
	return results;
}
function createStyled(input = {}) {
	const { themeId, defaultTheme = systemDefaultTheme, rootShouldForwardProp = shouldForwardProp, slotShouldForwardProp = shouldForwardProp } = input;
	function styleAttachTheme(props) {
		attachTheme(props, themeId, defaultTheme);
	}
	const styled = (tag, inputOptions = {}) => {
		internal_mutateStyles(tag, (styles) => styles.filter((style) => style !== styleFunctionSx_default));
		const { name: componentName, slot: componentSlot, skipVariantsResolver: inputSkipVariantsResolver, skipSx: inputSkipSx, overridesResolver = defaultOverridesResolver(lowercaseFirstLetter(componentSlot)), ...options } = inputOptions;
		const layerName = componentName && componentName.startsWith("Mui") || !!componentSlot ? "components" : "custom";
		const skipVariantsResolver = inputSkipVariantsResolver !== void 0 ? inputSkipVariantsResolver : componentSlot && componentSlot !== "Root" && componentSlot !== "root" || false;
		const skipSx = inputSkipSx || false;
		let shouldForwardPropOption = shouldForwardProp;
		if (componentSlot === "Root" || componentSlot === "root") shouldForwardPropOption = rootShouldForwardProp;
		else if (componentSlot) shouldForwardPropOption = slotShouldForwardProp;
		else if (isStringTag(tag)) shouldForwardPropOption = void 0;
		const defaultStyledResolver = styled$1(tag, {
			shouldForwardProp: shouldForwardPropOption,
			label: generateStyledLabel(componentName, componentSlot),
			...options
		});
		const transformStyle = (style) => {
			if (style.__emotion_real === style) return style;
			if (typeof style === "function") return function styleFunctionProcessor(props) {
				return processStyle(props, style, props.theme.modularCssLayers ? layerName : void 0);
			};
			if (isPlainObject(style)) {
				const serialized = preprocessStyles(style);
				return function styleObjectProcessor(props) {
					if (!serialized.variants) return props.theme.modularCssLayers ? shallowLayer(serialized.style, layerName) : serialized.style;
					return processStyle(props, serialized, props.theme.modularCssLayers ? layerName : void 0);
				};
			}
			return style;
		};
		const muiStyledResolver = (...expressionsInput) => {
			const expressionsHead = [];
			const expressionsBody = expressionsInput.map(transformStyle);
			const expressionsTail = [];
			expressionsHead.push(styleAttachTheme);
			if (componentName && overridesResolver) expressionsTail.push(function styleThemeOverrides(props) {
				const styleOverrides = props.theme.components?.[componentName]?.styleOverrides;
				if (!styleOverrides) return null;
				const resolvedStyleOverrides = {};
				for (const slotKey in styleOverrides) resolvedStyleOverrides[slotKey] = processStyle(props, styleOverrides[slotKey], props.theme.modularCssLayers ? "theme" : void 0);
				return overridesResolver(props, resolvedStyleOverrides);
			});
			if (componentName && !skipVariantsResolver) expressionsTail.push(function styleThemeVariants(props) {
				const themeVariants = props.theme?.components?.[componentName]?.variants;
				if (!themeVariants) return null;
				return processStyleVariants(props, themeVariants, [], props.theme.modularCssLayers ? "theme" : void 0);
			});
			if (!skipSx) expressionsTail.push(styleFunctionSx_default);
			if (Array.isArray(expressionsBody[0])) {
				const inputStrings = expressionsBody.shift();
				const placeholdersHead = new Array(expressionsHead.length).fill("");
				const placeholdersTail = new Array(expressionsTail.length).fill("");
				let outputStrings;
				outputStrings = [
					...placeholdersHead,
					...inputStrings,
					...placeholdersTail
				];
				outputStrings.raw = [
					...placeholdersHead,
					...inputStrings.raw,
					...placeholdersTail
				];
				expressionsHead.unshift(outputStrings);
			}
			const expressions = [
				...expressionsHead,
				...expressionsBody,
				...expressionsTail
			];
			const Component = defaultStyledResolver(...expressions);
			if (tag.muiName) Component.muiName = tag.muiName;
			Component.displayName = generateDisplayName(componentName, componentSlot, tag);
			return Component;
		};
		if (defaultStyledResolver.withConfig) muiStyledResolver.withConfig = defaultStyledResolver.withConfig;
		return muiStyledResolver;
	};
	return styled;
}
function generateDisplayName(componentName, componentSlot, tag) {
	if (componentName) return `${componentName}${capitalize(componentSlot || "")}`;
	return `Styled(${getDisplayName(tag)})`;
}
function generateStyledLabel(componentName, componentSlot) {
	let label;
	if (componentName) label = `${componentName}-${lowercaseFirstLetter(componentSlot || "Root")}`;
	return label;
}
function isStringTag(tag) {
	return typeof tag === "string" && tag.charCodeAt(0) > 96;
}
function lowercaseFirstLetter(string) {
	if (!string) return string;
	return string.charAt(0).toLowerCase() + string.slice(1);
}
//#endregion
//#region ../node_modules/@mui/system/memoTheme.mjs
var arg = { theme: void 0 };
/**
* Memoize style function on theme.
* Intended to be used in styled() calls that only need access to the theme.
*/
function unstable_memoTheme(styleFn) {
	let lastValue;
	let lastTheme;
	return function styleMemoized(props) {
		let value = lastValue;
		if (value === void 0 || props.theme !== lastTheme) {
			arg.theme = props.theme;
			value = preprocessStyles(styleFn(arg));
			lastValue = value;
			lastTheme = props.theme;
		}
		return value;
	};
}
//#endregion
//#region ../node_modules/@mui/utils/composeClasses/composeClasses.mjs
/**
* Compose classes from multiple sources.
*
* @example
* ```tsx
* const slots = {
*  root: ['root', 'primary'],
*  label: ['label'],
* };
*
* const getUtilityClass = (slot) => `MuiButton-${slot}`;
*
* const classes = {
*   root: 'my-root-class',
* };
*
* const output = composeClasses(slots, getUtilityClass, classes);
* // {
* //   root: 'MuiButton-root MuiButton-primary my-root-class',
* //   label: 'MuiButton-label',
* // }
* ```
*
* @param slots a list of classes for each possible slot
* @param getUtilityClass a function to resolve the class based on the slot name
* @param classes the input classes from props
* @returns the resolved classes for all slots
*/
function composeClasses(slots, getUtilityClass, classes = void 0) {
	const output = {};
	for (const slotName in slots) {
		const slot = slots[slotName];
		let buffer = "";
		let start = true;
		for (let i = 0; i < slot.length; i += 1) {
			const value = slot[i];
			if (value) {
				buffer += (start === true ? "" : " ") + getUtilityClass(value);
				start = false;
				if (classes && classes[value]) buffer += " " + classes[value];
			}
		}
		output[slotName] = buffer;
	}
	return output;
}
//#endregion
//#region ../node_modules/@mui/material/styles/slotShouldForwardProp.mjs
function slotShouldForwardProp(prop) {
	return prop !== "ownerState" && prop !== "theme" && prop !== "sx" && prop !== "as";
}
//#endregion
//#region ../node_modules/@mui/material/styles/rootShouldForwardProp.mjs
var rootShouldForwardProp = (prop) => slotShouldForwardProp(prop) && prop !== "classes";
//#endregion
//#region ../node_modules/@mui/material/styles/styled.mjs
var styled = createStyled({
	themeId: identifier_default,
	defaultTheme,
	rootShouldForwardProp
});
//#endregion
//#region ../node_modules/@mui/material/utils/capitalize.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types(), 1);
var capitalize_default = capitalize;
//#endregion
//#region ../node_modules/@mui/material/utils/memoTheme.mjs
var memoTheme = unstable_memoTheme;
//#endregion
//#region ../node_modules/@mui/material/SvgIcon/svgIconClasses.mjs
function getSvgIconUtilityClass(slot) {
	return generateUtilityClass("MuiSvgIcon", slot);
}
var svgIconClasses = generateUtilityClasses("MuiSvgIcon", [
	"root",
	"colorPrimary",
	"colorSecondary",
	"colorAction",
	"colorError",
	"colorDisabled",
	"fontSizeInherit",
	"fontSizeSmall",
	"fontSizeMedium",
	"fontSizeLarge"
]);
//#endregion
//#region ../node_modules/@mui/material/styles/reducedMotion.mjs
var defaultStyles = { transition: "none" };
function resolveReducedMotionStyles(reducedMotion, styles) {
	if (reducedMotion === "always") return styles;
	if (reducedMotion === "system") return { "@media (prefers-reduced-motion: reduce)": styles };
	return null;
}
//#endregion
//#region ../node_modules/@mui/material/transitions/utils.mjs
var reflow = (node) => node.scrollTop;
var DEFAULT_TRANSLATE_OFFSET = {
	offsetX: 0,
	offsetY: 0
};
var EMPTY_STYLE = {};
var DEFAULT_TRANSITION_PROPS = ["all"];
var EMPTY_OPTIONS = {};
var transformOffsetIndexes = {
	matrix: [4, 5],
	matrix3d: [12, 13],
	translate: [0, 1],
	translate3d: [0, 1],
	translateX: [0, null],
	translateY: [null, 0]
};
function parseTranslateValue(value) {
	const parsedValue = parseFloat(value ?? "");
	return Number.isNaN(parsedValue) ? 0 : parsedValue;
}
function parseTransform(transform) {
	const match = transform.match(/^(matrix|matrix3d|translate|translate3d|translateX|translateY)\((.+)\)$/);
	if (!match) return null;
	return {
		type: match[1],
		values: match[2].split(",").map(parseTranslateValue)
	};
}
function getTranslateOffsetValue(values, index) {
	return index === null ? 0 : values[index] || 0;
}
/**
* Extracts the x/y translation from a CSS transform string.
*
* Transition components use these offsets when calculating off-screen positions:
* if an element is already translated, the distance needed to hide it must start
* from that visual position instead of its untransformed layout position.
*
* CSSOM commonly serializes translations as matrix() or matrix3d(), while inline
* gesture styles may use translate(), translate3d(), translateX(), or
* translateY(). This helper normalizes those supported forms into numeric pixel
* offsets and returns zero offsets for empty, none, or unsupported transforms.
*/
function getTranslateOffsets(transform) {
	if (!transform || transform === "none") return DEFAULT_TRANSLATE_OFFSET;
	const parsedTransform = parseTransform(transform);
	if (!parsedTransform) return DEFAULT_TRANSLATE_OFFSET;
	const { type, values } = parsedTransform;
	const offsetIndexes = transformOffsetIndexes[type];
	if (!offsetIndexes) return DEFAULT_TRANSLATE_OFFSET;
	return {
		offsetX: getTranslateOffsetValue(values, offsetIndexes[0]),
		offsetY: getTranslateOffsetValue(values, offsetIndexes[1])
	};
}
function normalizedTransitionCallback(nodeRef, callback) {
	return (maybeIsAppearing) => {
		if (callback) {
			const node = nodeRef.current;
			if (maybeIsAppearing === void 0) callback(node);
			else callback(node, maybeIsAppearing);
		}
	};
}
/**
* Return the child style for a transition. Reuse predefined style objects when
* no custom styles are present so memoized children see the same object.
*/
function getTransitionChildStyle(state, inProp, baseStyles, hiddenStyles, styleProp, childStyle) {
	const base = state === "exited" && !inProp ? hiddenStyles : baseStyles[state] || baseStyles.exited;
	return styleProp || childStyle ? {
		...base,
		...styleProp,
		...childStyle
	} : base;
}
function getTransitionProps(props, options) {
	const { timeout, easing, style = EMPTY_STYLE } = props;
	return {
		duration: style.transitionDuration ?? (typeof timeout === "number" ? timeout : timeout[options.mode] || 0),
		easing: style.transitionTimingFunction ?? (typeof easing === "object" ? easing[options.mode] : easing),
		delay: style.transitionDelay
	};
}
/**
* Returns CSS that disables component-owned transitions when reduced motion is active.
* Pass custom styles only when the default `transition: none` reset is not enough.
*/
function getReducedMotionStyles(theme, styles) {
	const resolvedStyles = styles ?? defaultStyles;
	return resolveReducedMotionStyles(theme.motion?.reducedMotion, resolvedStyles);
}
function getTransitionStyles(theme, props = DEFAULT_TRANSITION_PROPS, options = EMPTY_OPTIONS) {
	const transition = theme.transitions?.create?.(props, options);
	const reducedMotionStyles = getReducedMotionStyles(theme);
	if (transition === void 0) return reducedMotionStyles ?? EMPTY_STYLE;
	const transitionStyles = { transition };
	return reducedMotionStyles ? {
		...transitionStyles,
		...reducedMotionStyles
	} : transitionStyles;
}
//#endregion
//#region ../node_modules/@mui/material/SvgIcon/SvgIcon.mjs
var import_jsx_runtime = require_jsx_runtime();
var useUtilityClasses = (ownerState) => {
	const { color, fontSize, classes } = ownerState;
	return composeClasses({ root: [
		"root",
		color !== "inherit" && `color${capitalize_default(color)}`,
		`fontSize${capitalize_default(fontSize)}`
	] }, getSvgIconUtilityClass, classes);
};
var SvgIconRoot = styled("svg", {
	name: "MuiSvgIcon",
	slot: "Root",
	overridesResolver: (props, styles) => {
		const { ownerState } = props;
		return [
			styles.root,
			ownerState.color !== "inherit" && styles[`color${capitalize_default(ownerState.color)}`],
			styles[`fontSize${capitalize_default(ownerState.fontSize)}`]
		];
	}
})(memoTheme(({ theme }) => ({
	userSelect: "none",
	width: "1em",
	height: "1em",
	display: "inline-block",
	flexShrink: 0,
	...getTransitionStyles(theme, "fill", { duration: (theme.vars ?? theme).transitions?.duration?.shorter }),
	variants: [
		{
			props: (props) => !props.hasSvgAsChild,
			style: { fill: "currentColor" }
		},
		{
			props: { fontSize: "inherit" },
			style: { fontSize: "inherit" }
		},
		{
			props: { fontSize: "small" },
			style: { fontSize: theme.typography?.pxToRem?.(20) || "1.25rem" }
		},
		{
			props: { fontSize: "medium" },
			style: { fontSize: theme.typography?.pxToRem?.(24) || "1.5rem" }
		},
		{
			props: { fontSize: "large" },
			style: { fontSize: theme.typography?.pxToRem?.(35) || "2.1875rem" }
		},
		...Object.entries((theme.vars ?? theme).palette).filter(([, value]) => value && value.main).map(([color]) => ({
			props: { color },
			style: { color: (theme.vars ?? theme).palette?.[color]?.main }
		})),
		{
			props: { color: "action" },
			style: { color: (theme.vars ?? theme).palette?.action?.active }
		},
		{
			props: { color: "disabled" },
			style: { color: (theme.vars ?? theme).palette?.action?.disabled }
		},
		{
			props: { color: "inherit" },
			style: { color: void 0 }
		}
	]
})));
var SvgIcon = /*#__PURE__*/ import_react.forwardRef(function SvgIcon(inProps, ref) {
	const props = useDefaultProps({
		props: inProps,
		name: "MuiSvgIcon"
	});
	const { children, className, color = "inherit", component = "svg", fontSize = "medium", htmlColor, inheritViewBox = false, titleAccess, viewBox = "0 0 24 24", ...other } = props;
	const hasSvgAsChild = /*#__PURE__*/ import_react.isValidElement(children) && children.type === "svg";
	const ownerState = {
		...props,
		color,
		component,
		fontSize,
		instanceFontSize: inProps.fontSize,
		inheritViewBox,
		viewBox,
		hasSvgAsChild
	};
	const more = {};
	if (!inheritViewBox) more.viewBox = viewBox;
	const classes = useUtilityClasses(ownerState);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(SvgIconRoot, {
		as: component,
		className: clsx(classes.root, className),
		focusable: "false",
		color: htmlColor,
		"aria-hidden": titleAccess ? void 0 : true,
		role: titleAccess ? "img" : void 0,
		ref,
		...more,
		...other,
		...hasSvgAsChild && children.props,
		ownerState,
		children: [hasSvgAsChild ? children.props.children : children, titleAccess ? /*#__PURE__*/ (0, import_jsx_runtime.jsx)("title", { children: titleAccess }) : null]
	});
});
SvgIcon.propTypes = {
	/**
	* Node passed into the SVG element.
	*/
	children: import_prop_types.default.node,
	/**
	* Override or extend the styles applied to the component.
	*/
	classes: import_prop_types.default.object,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string,
	/**
	* The color of the component.
	* It supports both default and custom theme colors, which can be added as shown in the
	* [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
	* You can use the `htmlColor` prop to apply a color attribute to the SVG element.
	* @default 'inherit'
	*/
	color: import_prop_types.default.oneOfType([import_prop_types.default.oneOf([
		"inherit",
		"action",
		"disabled",
		"primary",
		"secondary",
		"error",
		"info",
		"success",
		"warning"
	]), import_prop_types.default.string]),
	/**
	* The component used for the root node.
	* Either a string to use a HTML element or a component.
	*/
	component: import_prop_types.default.elementType,
	/**
	* The fontSize applied to the icon. Defaults to 24px, but can be configure to inherit font size.
	* @default 'medium'
	*/
	fontSize: import_prop_types.default.oneOfType([import_prop_types.default.oneOf([
		"inherit",
		"large",
		"medium",
		"small"
	]), import_prop_types.default.string]),
	/**
	* Applies a color attribute to the SVG element.
	*/
	htmlColor: import_prop_types.default.string,
	/**
	* If `true`, the root node will inherit the custom `component`'s viewBox and the `viewBox`
	* prop will be ignored.
	* Useful when you want to reference a custom `component` and have `SvgIcon` pass that
	* `component`'s viewBox to the root node.
	* @default false
	*/
	inheritViewBox: import_prop_types.default.bool,
	/**
	* The shape-rendering attribute. The behavior of the different options is described on the
	* [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering).
	* If you are having issues with blurry icons you should investigate this prop.
	*/
	shapeRendering: import_prop_types.default.string,
	/**
	* The system prop that allows defining system overrides as well as additional CSS styles.
	*/
	sx: import_prop_types.default.oneOfType([
		import_prop_types.default.arrayOf(import_prop_types.default.oneOfType([
			import_prop_types.default.func,
			import_prop_types.default.object,
			import_prop_types.default.bool
		])),
		import_prop_types.default.func,
		import_prop_types.default.object
	]),
	/**
	* Provides a human-readable title for the element that contains it.
	* https://www.w3.org/TR/SVG-access/#Equivalent
	*/
	titleAccess: import_prop_types.default.string,
	/**
	* Allows you to redefine what the coordinates without units mean inside an SVG element.
	* For example, if the SVG element is 500 (width) by 200 (height),
	* and you pass viewBox="0 0 50 20",
	* this means that the coordinates inside the SVG will go from the top left corner (0,0)
	* to bottom right (50,20) and each unit will be worth 10px.
	* @default '0 0 24 24'
	*/
	viewBox: import_prop_types.default.string
};
SvgIcon.muiName = "SvgIcon";
//#endregion
//#region ../node_modules/@mui/material/SvgIcon/createSvgIcon.mjs
/**
* Private module reserved for @mui packages.
*/
function createSvgIcon(path, displayName) {
	function Component(props, ref) {
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(SvgIcon, {
			"data-testid": `${displayName}Icon`,
			ref,
			...props,
			children: path
		});
	}
	Component.displayName = `${displayName}Icon`;
	Component.muiName = SvgIcon.muiName;
	return /*#__PURE__*/ import_react.memo(/*#__PURE__*/ import_react.forwardRef(Component));
}
//#endregion
export { composeClasses as _, getTransitionProps as a, normalizedTransitionCallback as c, svgIconClasses as d, memoTheme as f, slotShouldForwardProp as g, rootShouldForwardProp as h, getTransitionChildStyle as i, reflow as l, styled as m, SvgIcon as n, getTransitionStyles as o, capitalize_default as p, getReducedMotionStyles as r, getTranslateOffsets as s, createSvgIcon as t, getSvgIconUtilityClass as u, createStyled as v, generateUtilityClasses as y };
