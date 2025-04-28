import { c as create_ssr_component } from "../../../chunks/ssr.js";
import "../../../chunks/client.js";
import "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import "../../../chunks/Toaster.svelte_svelte_type_style_lang.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="container mx-auto px-4 py-8"><div class="max-w-2xl mx-auto"><h1 class="text-3xl font-bold mb-6" data-svelte-h="svelte-49xj0s">VIP Profile Setup</h1> <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"><div class="mb-6" data-svelte-h="svelte-1afmmti"><div class="flex items-center justify-center bg-secondary-100 dark:bg-secondary-900 p-4 rounded-lg"><span class="text-2xl mr-3">✨</span> <p class="text-secondary-800 dark:text-secondary-200">Welcome to the VIP area! Let&#39;s set up your profile.</p></div></div> <form class="space-y-6"><div><label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" data-svelte-h="svelte-1bzv6si">Display Name</label> <input type="text" id="displayName" class="input" placeholder="How should we call you?" ${""}></div> <div><label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" data-svelte-h="svelte-1tixj1w">Bio</label> <textarea id="bio" rows="3" class="input" placeholder="Tell us a bit about yourself..." ${""}></textarea></div> <button type="submit" class="btn btn-primary w-full" ${""}>${`Complete Setup`}</button></form></div></div></div>`;
});
export {
  Page as default
};
