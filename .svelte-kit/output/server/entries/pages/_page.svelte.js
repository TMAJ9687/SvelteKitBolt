import { c as create_ssr_component, v as validate_component, h as add_attribute } from "../../chunks/ssr.js";
import "../../chunks/client.js";
import { I as Icon, T as ThemeToggle } from "../../chunks/Icon.js";
import "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import "../../chunks/Toaster.svelte_svelte_type_style_lang.js";
const Dice_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2",
        "ry": "2"
      }
    ],
    ["path", { "d": "M12 12h.01" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "dice-1" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
function validateNickname(value) {
  return false;
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isNicknameValid;
  let nickname = "";
  let isSubmitting = false;
  isNicknameValid = validateNickname();
  return `${$$result.head += `<!-- HEAD_svelte-8t057_START -->${$$result.title = `<title>Chatwii - Anonymous 1-on-1 Chat</title>`, ""}<meta name="description" content="Chat anonymously with like-minded individuals. No registration required."><!-- HEAD_svelte-8t057_END -->`, ""} <div class="min-h-screen flex flex-col"><header class="w-full p-4 flex justify-between items-center"><div class="text-2xl font-display font-bold text-primary-500" data-svelte-h="svelte-wsq3yn">Chatwii</div> <div class="flex items-center gap-3">${validate_component(ThemeToggle, "ThemeToggle").$$render($$result, {}, {}, {})} <button class="btn bg-secondary-500 text-white hover:bg-secondary-600 px-4 py-2 rounded-lg font-medium flex items-center" data-svelte-h="svelte-12qhyw3"><span class="mr-1">✨</span> VIP</button></div></header> <main class="flex-grow flex flex-col items-center justify-center p-4 md:p-8"><div class="card max-w-md w-full mx-auto p-8 animate-fade-in"><div class="text-center mb-6" data-svelte-h="svelte-1otstlo"><h1 class="text-3xl font-bold mb-2"><span class="text-gray-900 dark:text-white">Text</span> <span class="text-secondary-500">Anonymously</span></h1> <h2 class="text-xl mb-4"><span class="text-gray-900 dark:text-white">with</span> <span class="text-primary-400">no registration</span></h2> <p class="text-gray-600 dark:text-gray-300">Unleash your creativity and connect with like-minded individuals on our chatting website, where conversations come to life.</p></div> <div class="mb-6"><div class="relative"><input type="text" id="nickname" placeholder="Enter Nickname" class="input pr-12"${add_attribute("maxlength", 16, 0)}${add_attribute("value", nickname, 0)}> <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-500 transition-colors" title="Generate random nickname">${validate_component(Dice_1, "Dice").$$render($$result, { size: 20 }, {}, {})}</button></div> ${``}</div> <button ${!isNicknameValid || isSubmitting ? "disabled" : ""} class="btn btn-primary w-full">${`Start Chat`}</button></div> <div class="w-full max-w-3xl mx-auto mt-12 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center" data-svelte-h="svelte-1tehlmd"><p class="text-gray-500 dark:text-gray-400">Google AdSense Placeholder</p></div></main></div> ${``}`;
});
export {
  Page as default
};
