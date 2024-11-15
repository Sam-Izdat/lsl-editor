import { writable } from 'svelte/store';

interface Message {
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const scriptLog = writable<Message[]>([]);

export function postScriptMessage(status: Message['status'], message: string) {
  scriptLog.update((log) => [...log, { status, message }]);
}

export function clearScriptMessages() {
  scriptLog.set([]);
}