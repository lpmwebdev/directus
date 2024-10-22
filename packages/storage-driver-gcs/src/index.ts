import type { ChunkedUploadContext, ReadOptions, TusDriver } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import type { Bucket, CreateReadStreamOptions, GetFilesOptions } from '@google-cloud/storage';
import { Storage } from '@google-cloud/storage';
import { TUS_RESUMABLE } from '@tus/utils';
import { join } from 'node:path';
import { PassThrough, type Readable } from 'node:stream';
import { finished, pipeline } from 'node:stream/promises';

export type DriverGCSConfig = {
	root?: string;
	bucket: string;
	apiEndpoint?: string;
	tus?: {
		chunkSize?: number;
	};
};

export class DriverGCS implements TusDriver {
	private root: string;
	private bucket: Bucket;

	// TUS specific members
	private readonly preferredChunkSize: number;

	constructor(config: DriverGCSConfig) {
		const { bucket, root, tus, ...storageOptions } = config;

		this.root = root ? normalizePath(root, { removeLeading: true }) : '';

		const storage = new Storage(storageOptions);
		this.bucket = storage.bucket(bucket);

		this.preferredChunkSize = tus?.chunkSize ?? 8388608;
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	private file(filepath: string) {
		return this.bucket.file(filepath);
	}

	async read(filepath: string, options?: ReadOptions) {
		const { range } = options || {};

		const stream_options: CreateReadStreamOptions = {};

		if (range?.start) stream_options.start = range.start;
		if (range?.end) stream_options.end = range.end;

		return this.file(this.fullPath(filepath)).createReadStream(stream_options);
	}

	async write(filepath: string, content: Readable) {
		const file = this.file(this.fullPath(filepath));
		const stream = file.createWriteStream({ resumable: false });
		await pipeline(content, stream);
	}

	async delete(filepath: string) {
		await this.file(this.fullPath(filepath)).delete();
	}

	async stat(filepath: string) {
		const [{ size, updated }] = await this.file(this.fullPath(filepath)).getMetadata();
		return { size: size as number, modified: new Date(updated as string) };
	}

	async exists(filepath: string) {
		return (await this.file(this.fullPath(filepath)).exists())[0];
	}

	async move(src: string, dest: string) {
		await this.file(this.fullPath(src)).move(this.file(this.fullPath(dest)));
	}

	async copy(src: string, dest: string) {
		await this.file(this.fullPath(src)).copy(this.file(this.fullPath(dest)));
	}

	async *list(prefix = '') {
		let query: GetFilesOptions = {
			prefix: this.fullPath(prefix),
			autoPaginate: false,
			maxResults: 500,
		};

		while (query) {
			const [files, nextQuery] = await this.bucket.getFiles(query);

			for (const file of files) {
				yield file.name.substring(this.root.length);
			}

			query = nextQuery;
		}
	}

	get tusExtensions() {
		return ['creation', 'termination', 'expiration'];
	}

	async createChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<ChunkedUploadContext> {
		const file = this.file(this.fullPath(filepath));

		const stream = file.createWriteStream({
			chunkSize: this.preferredChunkSize,
			metadata: {
				metadata: {
					tus_version: TUS_RESUMABLE,
				},
			},
		});

		const passThrough = new PassThrough();
		passThrough.end();

		passThrough.pipe(stream);

		await finished(passThrough);

		return context;
	}

	async writeChunk(
		filepath: string,
		content: Readable,
		offset: number,
		context: ChunkedUploadContext,
	): Promise<number> {
		const file = this.file(this.fullPath(filepath));

		const stream = file.createWriteStream({
			chunkSize: this.preferredChunkSize,
			metadata: {
				metadata: {
					size: context.size ?? null,
					offset,
					tus_version: TUS_RESUMABLE,
				},
			},
		});

		let bytesUploaded = offset || 0;

		content.on('data', (chunk: Buffer) => {
			bytesUploaded += chunk.length;
		});

		try {
			await pipeline(content, stream);
		} catch {
			this.delete(filepath).catch(() => {
				/* ignore */
			});
		}

		return bytesUploaded;
	}

	async finishChunkedUpload(_filepath: string, _context: ChunkedUploadContext): Promise<void> {
		return;
	}

	async deleteChunkedUpload(filepath: string, _context: ChunkedUploadContext): Promise<void> {
		await this.delete(filepath);
	}
}

export default DriverGCS;
