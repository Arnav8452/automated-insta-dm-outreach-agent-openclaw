"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var puppeteer_1 = require("puppeteer");
var path = require("path");
var child_process_1 = require("child_process");
// Get target handle, message, and thread ID from arguments
var _a = process.argv.slice(2), targetHandle = _a[0], messageTemplate = _a[1], threadId = _a[2];
if (!targetHandle || !messageTemplate || !threadId) {
    console.error("Usage: ts-node scripts/dm_sender.ts <targetHandle> <messageTemplate> <threadId>");
    process.exit(1);
}
var EXTENSION_PATH = path.resolve(__dirname, '../influencer-dm-extension');
var USER_DATA_DIR = path.resolve(__dirname, "../browser_data/ig_session_temp_".concat(Date.now()));
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, extPage, extensionId, page, templateName, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Launching Chrome with the DM Extension loaded...");
                    return [4 /*yield*/, puppeteer_1.default.launch({
                            headless: false,
                            executablePath: puppeteer_1.default.executablePath(),
                            dumpio: true,
                            userDataDir: USER_DATA_DIR,
                            args: [
                                "--disable-extensions-except=".concat(EXTENSION_PATH),
                                "--load-extension=".concat(EXTENSION_PATH),
                                '--no-sandbox',
                                '--disable-setuid-sandbox'
                            ],
                            defaultViewport: null // Let it take up the window
                        })];
                case 1:
                    browser = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 24, 25, 27]);
                    // Find the extension ID reliably via chrome://extensions
                    console.log("Looking up extension ID via chrome://extensions...");
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    extPage = _a.sent();
                    return [4 /*yield*/, extPage.goto('chrome://extensions')];
                case 4:
                    _a.sent();
                    // Wait for extensions to load
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                case 5:
                    // Wait for extensions to load
                    _a.sent();
                    return [4 /*yield*/, extPage.evaluate(function () {
                            var _a, _b;
                            try {
                                var manager = document.querySelector('extensions-manager');
                                if (!manager || !manager.shadowRoot)
                                    return null;
                                var itemList = manager.shadowRoot.querySelector('extensions-item-list');
                                if (!itemList || !itemList.shadowRoot)
                                    return null;
                                var items = itemList.shadowRoot.querySelectorAll('extensions-item');
                                for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                                    var item = items_1[_i];
                                    // Find the one matching our name
                                    var name_1 = (_b = (_a = item.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('#name')) === null || _b === void 0 ? void 0 : _b.textContent;
                                    if (name_1 && name_1.includes('Influencer DM Manager')) {
                                        return item.getAttribute('id');
                                    }
                                }
                            }
                            catch (e) {
                                return null;
                            }
                            return null;
                        })];
                case 6:
                    extensionId = _a.sent();
                    return [4 /*yield*/, extPage.close()];
                case 7:
                    _a.sent();
                    if (!extensionId) {
                        throw new Error("Could not find the loaded extension ID from chrome://extensions");
                    }
                    console.log("Extension ID: ".concat(extensionId));
                    // Open the sidepanel directly in a new tab
                    console.log("Opening Extension Side Panel...");
                    return [4 /*yield*/, browser.newPage()];
                case 8:
                    page = _a.sent();
                    return [4 /*yield*/, page.goto("chrome-extension://".concat(extensionId, "/sidepanel.html"))];
                case 9:
                    _a.sent();
                    // Wait for the UI to load by looking for the platform selector
                    return [4 /*yield*/, page.waitForSelector('.platform-selector', { visible: true })];
                case 10:
                    // Wait for the UI to load by looking for the platform selector
                    _a.sent();
                    console.log("Side Panel DOM loaded. Waiting 2s for extension JS async initialization...");
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 2000); })];
                case 11:
                    _a.sent();
                    // Switch to Instagram platform if not already
                    return [4 /*yield*/, page.evaluate(function () {
                            var igBtn = document.querySelector('button[data-platform="instagram"]');
                            if (igBtn)
                                igBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            // Also dismiss the welcome card just in case
                            var dismissWelcome = document.getElementById('btnDismissWelcome');
                            if (dismissWelcome)
                                dismissWelcome.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        })];
                case 12:
                    // Switch to Instagram platform if not already
                    _a.sent();
                    // 1. Create the Template
                    console.log("Creating Template...");
                    templateName = "Template_".concat(threadId.substring(0, 8));
                    return [4 /*yield*/, page.evaluate(function (name, body) {
                            // Switch to templates tab
                            var tplTab = document.querySelector('button[data-subtab="bo-templates"]');
                            if (tplTab)
                                tplTab.click();
                            // Fill and add template
                            document.getElementById('newTemplateName').value = name;
                            document.getElementById('newTemplateBody').value = body;
                            var addBtn = document.getElementById('btnAddTemplate');
                            if (addBtn)
                                addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }, templateName, messageTemplate)];
                case 13:
                    _a.sent();
                    console.log("Template created: ".concat(templateName));
                    // Wait a tiny bit for storage save
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 500); })];
                case 14:
                    // Wait a tiny bit for storage save
                    _a.sent();
                    // 2. Set the Handle
                    console.log("Setting target handle: ".concat(targetHandle));
                    return [4 /*yield*/, page.evaluate(function (handle) {
                            // Switch to outreach tab
                            var outTab = document.querySelector('button[data-subtab="bo-outreach"]');
                            if (outTab)
                                outTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            document.getElementById('boHandles').value = handle;
                        }, targetHandle)];
                case 15:
                    _a.sent();
                    // Wait for tab switch animation
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 200); })];
                case 16:
                    // Wait for tab switch animation
                    _a.sent();
                    // 3. Select the Template from Dropdown
                    console.log("Assigning Template to campaign...");
                    return [4 /*yield*/, page.evaluate(function (name) {
                            var select = document.getElementById('boDefaultTemplate');
                            for (var i = 0; i < select.options.length; i++) {
                                if (select.options[i].text === name) {
                                    select.selectedIndex = i;
                                    select.dispatchEvent(new Event('change'));
                                    break;
                                }
                            }
                        }, templateName)];
                case 17:
                    _a.sent();
                    // Wait a tiny bit for React/DOM updates
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 500); })];
                case 18:
                    // Wait a tiny bit for React/DOM updates
                    _a.sent();
                    // 4. Start Outreach!
                    console.log("Starting Outreach process through the Chrome Extension...");
                    return [4 /*yield*/, page.evaluate(function () {
                            var parseBtn = document.getElementById('btnParseHandles');
                            if (parseBtn)
                                parseBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        })];
                case 19:
                    _a.sent();
                    // Wait for the parse logic to finish and show the start button
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 500); })];
                case 20:
                    // Wait for the parse logic to finish and show the start button
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector('#btnStartOutreach', { visible: true })];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var startBtn = document.getElementById('btnStartOutreach');
                            if (startBtn)
                                startBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        })];
                case 22:
                    _a.sent();
                    console.log("Outreach started successfully! The extension is now taking over.");
                    // Wait a while so the user can see it running
                    console.log("Leaving browser open for 30 seconds for verification...");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30000); })];
                case 23:
                    _a.sent();
                    return [3 /*break*/, 27];
                case 24:
                    error_1 = _a.sent();
                    console.error("Error during extension automation:", error_1);
                    return [3 /*break*/, 27];
                case 25: return [4 /*yield*/, browser.close()];
                case 26:
                    _a.sent();
                    // Update database state to AWAITING_REPLY to kick off the negotiation loop
                    console.log("Updating database state to AWAITING_REPLY...");
                    try {
                        (0, child_process_1.execSync)("npx ts-node skills/campaign_manager/update_thread_status.ts \"".concat(threadId, "\" \"AWAITING_REPLY\""), { stdio: 'inherit' });
                    }
                    catch (e) {
                        console.error("Failed to update thread status.", e);
                    }
                    process.exit(0);
                    return [7 /*endfinally*/];
                case 27: return [2 /*return*/];
            }
        });
    });
}
main();
