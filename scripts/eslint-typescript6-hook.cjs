"use strict";

const Module = require("node:module");

const ts6Entry = require.resolve("@typescript/typescript6");

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "typescript") {
    return ts6Entry;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
