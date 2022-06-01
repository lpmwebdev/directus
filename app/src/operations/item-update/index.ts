import { defineOperationApp, toArray } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'item-update',
	icon: 'edit',
	name: '$t:operations.item-update.name',
	description: '$t:operations.item-update.description',
	overview: ({ mode, collection, key }) => {
		const overviewItems = [
			{
				label: '$t:operations.item-update.mode.field',
				text: mode,
			},
			{
				label: '$t:collection',
				text: collection,
			},
		];

		if (mode !== 'query') {
			overviewItems.push({
				label: '$t:operations.item-update.key',
				text: key ? toArray(key).join(', ') : '--',
			});
		}

		return overviewItems;
	},
	options: [
		{
			field: 'permissions',
			name: '$t:permissions',
			type: 'string',
			schema: {
				default_value: '$trigger',
			},
			meta: {
				width: 'full',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'From Trigger',
							value: '$trigger',
						},
						{
							text: 'Public Role',
							value: '$public',
						},
						{
							text: 'Full Access',
							value: '$full',
						},
					],
					allowOther: true,
				},
			},
		},
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-collection',
			},
		},
		{
			field: 'key',
			name: '$t:operations.item-update.key',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					iconRight: 'vpn_key',
				},
				conditions: [
					{
						rule: {
							mode: {
								_eq: 'query',
							},
						},
						hidden: true,
					},
				],
			},
		},
		{
			field: 'payload',
			name: '$t:operations.item-update.payload',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
			},
		},
		{
			field: 'query',
			name: '$t:operations.item-update.query',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
				conditions: [
					{
						rule: {
							mode: {
								_neq: 'query',
							},
						},
						hidden: true,
					},
				],
			},
		},
	],
});
