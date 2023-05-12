import type { ChangelogFunctions, GetDependencyReleaseLine, GetReleaseLine } from '@changesets/types';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { MAIN_PACKAGE } from './constants';
import { generateMarkdown } from './generate-markdown';
import { getInfo } from './get-info';
import { getPackages } from './get-packages';
import { ChangesetsWithoutId } from './types';

const changesets: ChangesetsWithoutId = new Map();

const getReleaseLine: GetReleaseLine = async (changeset) => {
	const { id, ...rest } = changeset;
	changesets.set(id, rest);

	return '';
};

const getDependencyReleaseLine: GetDependencyReleaseLine = async () => {
	// Update of dependencies not included in the release notes
	// (also no way to get affected dependency)
	return '';
};

const defaultChangelogFunctions: ChangelogFunctions = {
	getReleaseLine,
	getDependencyReleaseLine,
};

async function run() {
	if (changesets.size === 0) {
		earlyExit();
	}

	const workspacePackages = await getPackages();

	const mainVersion = workspacePackages.find((p) => p.manifest.name === MAIN_PACKAGE)?.manifest.version;

	if (!mainVersion) {
		throw new Error(`Couldn't get main version ('${MAIN_PACKAGE}' package)`);
	}

	// Clean-up changelog files in favor of release notes
	for (const localPackage of workspacePackages) {
		const changelogPath = join(localPackage.dir, 'CHANGELOG.md');

		if (existsSync(changelogPath)) {
			unlinkSync(changelogPath);
		}
	}

	const { types, untypedPackages, packageVersions } = await getInfo(changesets, workspacePackages);

	if (types.length === 0 && untypedPackages.length === 0 && packageVersions.length === 0) {
		earlyExit();
	}

	generateMarkdown(mainVersion, types, untypedPackages, packageVersions);
}

process.on('beforeExit', async () => {
	await run();
	process.exit();
});

function earlyExit(): never {
	// eslint-disable-next-line no-console
	console.log('No (processable) changesets found: Skipping generation of release notes');
	process.exit();
}

export default defaultChangelogFunctions;
