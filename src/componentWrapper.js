import Vue from 'vue';
import wrap from '@vue/web-component-wrapper';
import EchoraumChat from './components/EchoraumChat';

const CustomElement = wrap(Vue, EchoraumChat);

window.customElements.define('echoraum-chat', CustomElement);
