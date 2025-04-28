import { c as create_ssr_component } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
import "../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
import "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-1mr3ftl_START -->${$$result.title = `<title>Chat - Chatwii</title>`, ""}<!-- HEAD_svelte-1mr3ftl_END -->`, ""} ${`<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" data-svelte-h="svelte-14n15vr"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>`}`;
});
export {
  Page as default
};
