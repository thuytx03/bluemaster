import __vite__cjsImport0_reactDom_client from "/vendor/.vite-deps-react-dom_client.js__v--45cb4d22.js"; const ReactDOM = __vite__cjsImport0_reactDom_client.__esModule ? __vite__cjsImport0_reactDom_client.default : __vite__cjsImport0_reactDom_client;
import __vite__cjsImport1_react from "/vendor/.vite-deps-react.js__v--45cb4d22.js"; const createElement = __vite__cjsImport1_react["createElement"];
import App from "/src/contentScript/App.tsx.js";
const container = document.createElement("div");
container.id = "facebook-master-tool";
document.body.appendChild(container);
const root = ReactDOM.createRoot(container);
root.render(createElement(App));
