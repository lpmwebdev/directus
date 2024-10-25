import { mount } from '@vue/test-utils';
import { beforeEach, expect, test } from 'vitest';
import { Router } from 'vue-router';

import { generateRouter } from '@/__utils__/router';
import type { GlobalMountOptions } from '@/__utils__/types';
import VCheckbox from '../v-checkbox.vue';
import VListGroup from '../v-list-group.vue';
import VListItemIcon from '../v-list-item-icon.vue';
import VListItem from '../v-list-item.vue';
import VList from '../v-list.vue';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';
import VCheckboxTree from './v-checkbox-tree.vue';

let router: Router;
let globalOptions: GlobalMountOptions;

beforeEach(async () => {
	router = generateRouter();
	router.push('/');
	await router.isReady();

	globalOptions = {
		components: {
			VCheckboxTreeCheckbox,
			VListItem,
			VListItemIcon,
			VListGroup,
			VCheckbox,
			VList,
		},
		stubs: ['v-highlight', 'v-icon'],
		plugins: [router],
	};
});

test('Mount VCheckboxTree component', () => {
	const wrapper = mount(VCheckboxTree, {
		global: globalOptions,
	});

	expect(VCheckboxTree).toBeTruthy();
	expect(wrapper.html()).toMatchSnapshot();
});
	