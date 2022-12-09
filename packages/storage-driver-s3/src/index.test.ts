import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DriverS3 } from './index.js';
import {
	randAlphaNumeric,
	randGitBranch as randBucket,
	randWord,
	randDirectoryPath,
	randDomainName,
	randFilePath,
	randNumber,
} from '@ngneat/falso';
import type { DriverS3Config } from './index.js';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@aws-sdk/client-s3');
vi.mock('node:path');

let driver: DriverS3;
let sample: {
	config: Required<DriverS3Config>;
	path: {
		input: string;
		full: string;
	};
	range: {
		start: number;
		end: number;
	};
};

beforeEach(() => {
	sample = {
		config: {
			key: randAlphaNumeric({ length: 20 }).join(''),
			secret: randAlphaNumeric({ length: 40 }).join(''),
			bucket: randBucket(),
			acl: randWord(),
			serverSideEncryption: randWord(),
			root: randDirectoryPath(),
			endpoint: `https://${randDomainName()}`,
		},
		path: {
			full: randFilePath(),
			input: randFilePath(),
		},
		range: {
			start: randNumber(),
			end: randNumber(),
		},
	};

	driver = new DriverS3({
		key: sample.config.key,
		secret: sample.config.secret,
		bucket: sample.config.bucket,
	});

	driver['fullPath'] = vi.fn().mockReturnValue(sample.path.full);
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	test('Creates S3Client with key / secret configuration', () => {
		expect(S3Client).toHaveBeenCalledWith({
			credentials: {
				accessKeyId: sample.config.key,
				secretAccessKey: sample.config.secret,
			},
		});

		expect(driver['client']).toBeInstanceOf(S3Client);
	});

	test('Sets private bucket reference based on config', () => {
		expect(driver['bucket']).toBe(sample.config.bucket);
	});

	test('Sets private acl reference based on config', () => {
		const driver = new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			acl: sample.config.acl,
		});

		expect(driver['acl']).toBe(sample.config.acl);
	});

	test('Sets private serverSideEncryption reference based on config', () => {
		const driver = new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			serverSideEncryption: sample.config.serverSideEncryption,
		});

		expect(driver['serverSideEncryption']).toBe(sample.config.serverSideEncryption);
	});

	test('Defaults root to empty string', () => {
		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		const mockRoot = randDirectoryPath();

		vi.mocked(normalizePath).mockReturnValue(mockRoot);

		const driver = new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			root: sample.config.root,
		});

		expect(normalizePath).toHaveBeenCalledWith(sample.config.root, { removeLeading: true });
		expect(driver['root']).toBe(mockRoot);
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		const driver = new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
		});

		vi.mocked(join).mockReturnValue(sample.path.full);
		vi.mocked(normalizePath).mockReturnValue(sample.path.full);

		driver['root'] = 'root/';

		const result = driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledWith('root/', sample.path.input);
		expect(normalizePath).toHaveBeenCalledWith(sample.path.full);
		expect(result).toBe(sample.path.full);
	});
});

describe('#getStream', () => {
	beforeEach(() => {
		driver['fullPath'] = vi.fn().mockReturnValue(sample.path.full);
		vi.mocked(driver['client'].send).mockReturnValue({ Body: new Readable() } as unknown as void);
		vi.mocked(isReadableStream).mockReturnValue(true);
	});

	test('Uses fullPath key / bucket in command input', async () => {
		await driver.getStream(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.full,
			Bucket: sample.config.bucket,
		});
	});

	test('Optionally allows setting start range offset', async () => {
		await driver.getStream(sample.path.input, { start: sample.range.start });

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.full,
			Bucket: sample.config.bucket,
			Range: `bytes=${sample.range.start}-`,
		});
	});

	test('Optionally allows setting end range offset', async () => {
		await driver.getStream(sample.path.input, { end: sample.range.end });

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.full,
			Bucket: sample.config.bucket,
			Range: `bytes=-${sample.range.end}`,
		});
	});

	test('Optionally allows setting start and end range offset', async () => {
		await driver.getStream(sample.path.input, sample.range);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.full,
			Bucket: sample.config.bucket,
			Range: `bytes=${sample.range.start}-${sample.range.end}`,
		});
	});

	test('Throws an error when no stream is returned', async () => {
		vi.mocked(driver['client'].send).mockReturnValue({ Body: undefined } as unknown as void);

		expect(driver.getStream(sample.path.input, sample.range)).rejects.toThrowError(
			new Error(`No stream returned for file "${sample.path.input}"`)
		);
	});

	test('Throws an error when returned stream is not a readable stream', async () => {
		vi.mocked(isReadableStream).mockReturnValue(false);

		expect(driver.getStream(sample.path.input, sample.range)).rejects.toThrowError(
			new Error(`No stream returned for file "${sample.path.input}"`)
		);
	});

	test('Returns stream from S3 client', async () => {
		const mockGetObjectCommand = {} as GetObjectCommand;
		const mockStream = {};

		vi.mocked(driver['client'].send).mockReturnValue({ Body: mockStream } as unknown as void);
		vi.mocked(GetObjectCommand).mockReturnValue(mockGetObjectCommand);

		const stream = await driver.getStream(sample.path.input, sample.range);

		expect(driver['client'].send).toHaveBeenCalledWith(mockGetObjectCommand);
		expect(stream).toBe(mockStream);
	});
});

describe('#getBuffer', () => {
	let mockStream: PassThrough;

	beforeEach(() => {
		mockStream = new PassThrough();
		driver.getStream = vi.fn().mockResolvedValue(mockStream);
	});

	test('Gets stream for given location', async () => {
		process.nextTick(() => {
			mockStream.emit('end');
		});

		await driver.getBuffer(sample.path.input);

		expect(driver.getStream).toHaveBeenCalledWith(sample.path.input);
	});

	test('Resolves buffer from stream contents', async () => {
		process.nextTick(() => {
			mockStream.emit('data', Buffer.from('test-'));
			mockStream.emit('data', Buffer.from('data'));
			mockStream.emit('end');
		});

		const buffer = await driver.getBuffer(sample.path.input);

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer).toStrictEqual(Buffer.from('test-data'));
	});

	test('Rejects with error on stream error', async () => {
		const mockError = new Error('Whoops');

		process.nextTick(() => {
			mockStream.emit('error', mockError);
		});

		try {
			await driver.getBuffer(sample.path.input);
		} catch (err) {
			expect(err).toBe(mockError);
		}
	});

	test('Rejects with error thrown from getStream', async () => {
		const mockError = new Error('Whoops');
		vi.mocked(driver.getStream).mockRejectedValue(mockError);
		expect(driver.getBuffer(sample.path.input)).rejects.toThrowError(mockError);
	});
});

describe('#getStat', () => {
	beforeEach(() => {
		vi.mocked(driver['client'].send).mockResolvedValue({
			ContentLength: 500,
			LastModified: new Date(2022, 11, 7, 14, 52, 0, 0),
		} as HeadObjectCommandOutput as unknown as void);
	});

	test('Uses HeadObjectCommand with fullPath', async () => {
		await driver.getStat(sample.path.input);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(HeadObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.full,
			Bucket: sample.config.bucket,
		});
	});

	test('Calls #send with HeadObjectCommand', async () => {
		const mockHeadObjectCommand = {} as HeadObjectCommand;
		vi.mocked(HeadObjectCommand).mockReturnValue(mockHeadObjectCommand);
		await driver.getStat(sample.path.input);
		expect(driver['client'].send).toHaveBeenCalledWith(mockHeadObjectCommand);
	});
});

describe('#exists', () => {
	test('Returns true if stat returns the stats', async () => {
		driver.getStat = vi.fn().mockResolvedValue({});
		const exists = await driver.exists('path/to/file.txt');
		expect(exists).toBe(true);
	});

	test('Returns false if stat throws an error', async () => {
		driver.getStat = vi.fn().mockRejectedValue(new Error('Something went wrong'));
		const exists = await driver.exists('path/to/file.txt');
		expect(exists).toBe(false);
	});
});

describe.todo('#move', () => {});

describe.todo('#copy', () => {});

describe.todo('#put', () => {});

describe.todo('#delete', () => {});

describe.todo('#list', () => {});
