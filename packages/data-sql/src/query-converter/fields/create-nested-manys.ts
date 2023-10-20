import type { AbstractQueryFieldNodeRelationalOneToMany } from '@directus/data';
import type { Result } from './fields.js';
import type { AbstractSqlNestedMany, AbstractSqlQueryConditionNode, AbstractSqlQueryWhereNode } from '../../index.js';

export function getSubQuery(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	nestedOutput: Result,
	idxGenerator: Generator<number, number, number>,
	alias: string
): AbstractSqlNestedMany {
	const where = getWhereClause(fieldMeta, idxGenerator);
	return {
		queryGenerator: (identifierValues) => ({
			clauses: {
				select: nestedOutput.clauses.select,
				from: fieldMeta.join.external.collection,
				where,
			},
			parameters: [...nestedOutput.parameters, ...identifierValues],
			aliasMapping: nestedOutput.aliasMapping,
			nestedManys: nestedOutput.nestedManys,
		}),
		alias,
		externalKeyFields: fieldMeta.join.external.fields,
		internalIdentifierFields: fieldMeta.join.internal.fields,
		collection: fieldMeta.join.external.collection,
	};
}

function getWhereClause(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryWhereNode {
	const table = fieldMeta.join.external.collection;

	if (fieldMeta.join.external.fields.length < 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: fieldMeta.join.external.fields.map((field) => getCondition(table, field, idxGenerator)) as [
				AbstractSqlQueryConditionNode,
				...AbstractSqlQueryConditionNode[]
			],
		};
	} else {
		return getCondition(table, fieldMeta.join.external.fields[0], idxGenerator);
	}
}

function getCondition(
	table: string,
	column: string,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		condition: {
			type: 'condition-string', // could also be a condition-number, but it doesn't matter because both support 'eq'
			operation: 'eq',
			target: {
				type: 'primitive',
				table,
				column,
			},
			compareTo: {
				type: 'value',
				parameterIndex: idxGenerator.next().value,
			},
		},
		negate: false,
	};
}
