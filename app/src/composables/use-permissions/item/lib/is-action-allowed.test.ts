import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { randomIdentifier } from '@directus/random';
import { ItemPermissions, Permission } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Ref, computed } from 'vue';
import { isFullPermission } from '../utils/is-full-permission';
import { isActionAllowed } from './is-action-allowed';

vi.mock('../utils/is-full-permission');

let sample: {
	collection: string;
};

const fetchedItemPermissionsSpy = vi.fn();
let fetchedItemPermissions: Ref<ItemPermissions>;

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	sample = {
		collection: randomIdentifier(),
	};

	fetchedItemPermissions = computed(() => {
		fetchedItemPermissionsSpy();
		return {
			update: {
				access: true,
			},
			delete: {
				access: true,
			},
			share: {
				access: true,
			},
		};
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

const actions = ['update', 'delete', 'share'] as const;

describe('admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = true;
	});

	describe.each(actions)('%s', (action) => {
		it('should be disallowed if item is new', () => {
			const isNew = true;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be allowed if item is not new', () => {
			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});
	});
});

describe('non-admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = false;
	});

	describe.each(actions)('%s', (action) => {
		it('should be disallowed if item is new', () => {
			const isNew = true;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be disallowed if user has no permission', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue(null);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be allowed if user has full permission', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue({} as Permission);

			vi.mocked(isFullPermission).mockReturnValue(true);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should check item-based permission for conditional permission rules', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue({} as Permission);

			vi.mocked(isFullPermission).mockReturnValue(false);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).toHaveBeenCalled();
		});
	});
});
