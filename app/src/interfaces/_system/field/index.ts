import { defineInterface } from '@/interfaces/define';
import InterfaceField from './field.vue';

export default defineInterface(({ i18n }) => ({
	id: 'field',
	name: '$t:field',
	icon: 'box',
	component: InterfaceField,
	types: ['string'],
	options: [],
	system: true,
}));
