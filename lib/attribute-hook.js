'use strict';

module.exports = AttributeHook;

function AttributeHook(value) {
    if (!(this instanceof AttributeHook)) {
        return new AttributeHook(value);
    }
    this.value = value;
}

AttributeHook.prototype.hook = function (node, prop, prev) {

    node.setAttribute(prop, this.value);
};

AttributeHook.prototype.unhook = function (node, prop, next) {
    if (next && next._type === 'AttributeHook') {
        return;
    }
    node.removeAttribute(prop)
};

AttributeHook.prototype._type = 'AttributeHook';
