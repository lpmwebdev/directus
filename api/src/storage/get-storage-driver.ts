// @ts-expect-error https://github.com/microsoft/TypeScript/issues/49721
import type { Driver } from '@directus/storage';

export const getStorageDriver = async (driverName: string): Promise<typeof Driver> => {
	const aliasMap: Record<string, string> = {
		local: '@directus/storage-driver-local',
		s3: '@directus/storage-driver-s3',
		gcs: '@directus/storage-driver-gcs',
		azure: '@directus/storage-driver-azure',
		cloudinary: '@directus/storage-driver-cloudinary',
	};

	if (driverName in aliasMap) {
		driverName = aliasMap[driverName];
	} else {
		throw new Error(`Driver "${driverName}" doesn't exist.`);
	}

	return (await import(driverName)).default;
};
