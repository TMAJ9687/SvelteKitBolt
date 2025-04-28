import { c as create_ssr_component, v as validate_component } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
import "../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import { I as Icon, T as ThemeToggle } from "../../../chunks/Icon.js";
import "iso-3166-1-alpha-2";
const Arrow_left = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [["path", { "d": "m12 19-7-7 7-7" }], ["path", { "d": "M19 12H5" }]];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "arrow-left" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900"><header class="w-full p-4 shadow-sm bg-white dark:bg-gray-800"><div class="max-w-4xl mx-auto flex justify-between items-center"><div class="flex items-center gap-4"><button class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Go back">${validate_component(Arrow_left, "ArrowLeft").$$render($$result, { size: 20 }, {}, {})}</button> <a href="/" class="text-2xl font-display font-bold text-primary-500" data-svelte-h="svelte-evqn5y">Chatwii</a></div> <div class="flex items-center gap-3">${validate_component(ThemeToggle, "ThemeToggle").$$render($$result, {}, {}, {})} <button class="btn bg-secondary-500 text-white hover:bg-secondary-600 px-4 py-2 rounded-lg font-medium flex items-center" data-svelte-h="svelte-1mg80gj"><span class="mr-1">✨</span> VIP</button></div></div></header> <main class="flex-grow flex flex-col items-center justify-center p-4">${`<div class="card p-8 w-full max-w-md mx-auto" data-svelte-h="svelte-oj6l0"><div class="flex justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div></div>`}</main>  <div class="w-full max-w-3xl mx-auto p-4 mb-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center" data-svelte-h="svelte-1hlf0iq"><p class="text-gray-500 dark:text-gray-400">Google AdSense Placeholder</p></div></div>`;
});
export {
  Page as default
};
