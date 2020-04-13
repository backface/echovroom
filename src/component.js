import Vue from 'vue';
import wrap from '@vue/web-component-wrapper';
import Echorooms from './components/Echorooms';

const CustomElement = wrap(Vue, Echorooms);

window.customElements.define('echo-rooms', CustomElement);
