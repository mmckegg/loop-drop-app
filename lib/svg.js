const h = require('mutant/html-element').forDocument(global.document, 'http://www.w3.org/2000/svg')
const SVG_PROPERTIES = [
  'about', 'accent-height', 'accumulate', 'additive', 'alignment-baseline', 'alphabetic', 'amplitude', 'arabic-form',
  'ascent', 'attributeName', 'attributeType', 'azimuth', 'bandwidth', 'baseFrequency', 'baseProfile', 'baseline-shift',
  'bbox', 'begin', 'bias', 'by', 'calcMode', 'cap-height', 'class', 'clip', 'clip-path', 'clip-rule', 'clipPathUnits',
  'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'content',
  'contentScriptType', 'contentStyleType', 'cursor', 'cx', 'cy', 'd', 'datatype', 'defaultAction', 'descent', 'diffuseConstant',
  'direction', 'display', 'divisor', 'dominant-baseline', 'dur', 'dx', 'dy', 'edgeMode', 'editable', 'elevation',
  'enable-background', 'end', 'event', 'exponent', 'externalResourcesRequired', 'fill', 'fill-opacity', 'fill-rule',
  'filter', 'filterRes', 'filterUnits', 'flood-color', 'flood-opacity', 'focusHighlight', 'focusable', 'font-family',
  'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'format', 'from',
  'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'glyphRef',
  'gradientTransform', 'gradientUnits', 'handler', 'hanging', 'height', 'horiz-adv-x', 'horiz-origin-x', 'horiz-origin-y',
  'id', 'ideographic', 'image-rendering', 'in', 'in2', 'initialVisibility', 'intercept', 'k', 'k1', 'k2', 'k3', 'k4',
  'kernelMatrix', 'kernelUnitLength', 'kerning', 'keyPoints', 'keySplines', 'keyTimes', 'lang', 'lengthAdjust', 'letter-spacing',
  'lighting-color', 'limitingConeAngle', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerHeight', 'markerUnits',
  'markerWidth', 'mask', 'maskContentUnits', 'maskUnits', 'mathematical', 'max', 'media', 'mediaCharacterEncoding',
  'mediaContentEncodings', 'mediaSize', 'mediaTime', 'method', 'min', 'mode', 'name', 'nav-down', 'nav-down-left',
  'nav-down-right', 'nav-left', 'nav-next', 'nav-prev', 'nav-right', 'nav-up', 'nav-up-left', 'nav-up-right', 'numOctaves',
  'observer', 'offset', 'opacity', 'operator', 'order', 'orient', 'orientation', 'origin', 'overflow', 'overlay',
  'overline-position', 'overline-thickness', 'panose-1', 'path', 'pathLength', 'patternContentUnits', 'patternTransform',
  'patternUnits', 'phase', 'playbackOrder', 'pointer-events', 'points', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'preserveAlpha',
  'preserveAspectRatio', 'primitiveUnits', 'propagate', 'property', 'r', 'radius', 'refX', 'refY', 'rel', 'rendering-intent',
  'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'requiredFonts', 'requiredFormats', 'resource', 'restart',
  'result', 'rev', 'role', 'rotate', 'rx', 'ry', 'scale', 'seed', 'shape-rendering', 'slope', 'snapshotTime', 'spacing',
  'specularConstant', 'specularExponent', 'spreadMethod', 'startOffset', 'stdDeviation', 'stemh', 'stemv', 'stitchTiles',
  'stop-color', 'stop-opacity', 'strikethrough-position', 'strikethrough-thickness', 'string', 'stroke', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'surfaceScale',
  'syncBehavior', 'syncBehaviorDefault', 'syncMaster', 'syncTolerance', 'syncToleranceDefault', 'systemLanguage', 'tableValues',
  'target', 'targetX', 'targetY', 'text-anchor', 'text-decoration', 'text-rendering', 'textLength', 'timelineBegin', 'title',
  'to', 'transform', 'transformBehavior', 'type', 'typeof', 'u1', 'u2', 'underline-position', 'underline-thickness', 'unicode',
  'unicode-bidi', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'values',
  'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'viewBox', 'viewTarget', 'visibility', 'width', 'widths',
  'word-spacing', 'writing-mode', 'x', 'x-height', 'x1', 'x2', 'xChannelSelector', 'y', 'y1', 'y2', 'yChannelSelector', 'z', 'zoomAndPan'
]

module.exports = require('micro-css/h')(function (tag, properties, children) {
  if (!children && (Array.isArray(properties) || isText(properties))) {
    children = properties
    properties = null
  }

  properties = properties || {}
  properties.attributes = properties.attributes || {}

  for (var key in properties) {
    if (SVG_PROPERTIES.includes(key)) {
      properties.attributes[key] = properties[key]
      properties[key] = null
    }
  }

  return h(tag, properties, children)
})

module.exports.destroy = require('mutant/html-element').destroy

function isText (value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
