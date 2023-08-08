import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { Project, findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { MAIN_PACKAGE, PACKAGE_ORDER, UNTYPED_PACKAGES } from '../constants.js';
import type { PackageVersion } from '../types.js';
import { sortByExternalOrder } from './sort.js';

export async function processPackages(): Promise<{
	mainVersion: string | undefined;
	packageVersions: PackageVersion[];
}> {
	const workspacePackages = await getPackages();
	let mainVersion;
	const packageVersionMap = new Map<string, string>();

	for (const localPackage of workspacePackages) {
		const { name, version } = localPackage.manifest;

		if (name === MAIN_PACKAGE) {
			mainVersion = version;
		}

		const changelogPath = join(localPackage.dir, 'CHANGELOG.md');

		if (existsSync(changelogPath)) {
			// The package has been bumped if a changelog file is generated
			// (also catching packages bumped only due to internal dependency updates from changeset)
			if (name && version) {
				packageVersionMap.set(name, version);
			}

			// Fix 'version' field in unversioned packages wrongly set to 'null' by changeset
			if (version === null) {
				const { version: _version, ...manifest } = localPackage.manifest;
				await localPackage.writeProjectManifest(manifest);
			}

			// Remove changelog files generated by changeset in favor of release notes
			unlinkSync(changelogPath);
		}
	}

	const packageVersions: PackageVersion[] = Array.from(packageVersionMap, ([name, version]) => ({
		name,
		version,
	}))
		.filter(({ name }) => ![MAIN_PACKAGE, ...Object.keys(UNTYPED_PACKAGES)].includes(name))
		.sort(sortByExternalOrder(PACKAGE_ORDER, 'name'));

	return { mainVersion, packageVersions };
}

async function getPackages(): Promise<Project[]> {
	const workspaceRoot = await findWorkspaceDir(process.cwd());

	if (!workspaceRoot) {
		throw new Error(`Couldn't locate workspace root`);
	}

	return findWorkspacePackagesNoCheck(workspaceRoot);
}
