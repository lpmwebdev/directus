import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { Ref, computed, unref } from 'vue';
import { Collection } from '../types';
import { isFieldAllowed } from '../utils/is-field-allowed';

export const isArchiveAllowed = (collection: Collection, updateAllowed: Ref<boolean>) => {
	const { info: collectionInfo } = useCollection(collection);
	const userStore = useUserStore();
	const { getPermission } = usePermissionsStore();

	return computed(() => {
		const archiveField = collectionInfo.value?.meta?.archive_field;
		if (!archiveField) return false;

		if (userStore.isAdmin) return true;

		const permission = getPermission(unref(collection), 'update');
		if (!permission) return false;

		if (!isFieldAllowed(permission, archiveField)) return false;

		return updateAllowed.value;
	});
};
