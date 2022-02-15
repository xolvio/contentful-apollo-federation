"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyThatContentfulEnvironmentVariablesAreSet = void 0;
const process_1 = __importDefault(require("process"));
function verifyThatContentfulEnvironmentVariablesAreSet() {
    const requiredEnvironmentVariables = [
        'CONTENTFUL_SPACE',
        'CONTENTFUL_TOKEN'
    ];
    const missingEnvironmentVariables = [];
    for (const environmentVariable of requiredEnvironmentVariables) {
        if (!process_1.default.env[environmentVariable]) {
            missingEnvironmentVariables.push(environmentVariable);
        }
    }
    if (missingEnvironmentVariables.length >= 1) {
        throw new Error('Please set the environment variable ' +
            `${missingEnvironmentVariables.map(environmentVariable => `"${environmentVariable}"`).join(', ')}.`);
    }
}
exports.verifyThatContentfulEnvironmentVariablesAreSet = verifyThatContentfulEnvironmentVariablesAreSet;
//# sourceMappingURL=verifyThatContentfulEnvironmentVariablesAreSet.js.map