const fs = require("node:fs");
const path = require("node:path");

function keepPathOnPermissionError(realpath) {
  return function patchedRealpathSync(target, ...rest) {
    try {
      return realpath.call(this, target, ...rest);
    } catch (error) {
      if (error && error.code === "EPERM" && typeof target === "string") {
        return path.resolve(target);
      }

      throw error;
    }
  };
}

fs.realpathSync = keepPathOnPermissionError(fs.realpathSync);

if (fs.realpathSync.native) {
  fs.realpathSync.native = keepPathOnPermissionError(fs.realpathSync.native);
}
