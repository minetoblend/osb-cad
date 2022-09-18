import {inject} from "vue";
import type {EditorContext} from "@/editor/ctx/context";

export function useContext(): EditorContext {
    return inject<EditorContext>('ctx')!
}