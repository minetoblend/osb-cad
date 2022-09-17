import {Vec2} from "@/util/math";
import {Ref} from "vue";


export interface IHasPosition {

    position: Vec2 | Ref<Vec2>

}