import type {
	AbstractQueryFieldNodeNestedMany,
	AbstractQueryFieldNodeRelationalOneToMany,
	AtLeastOneElement,
} from '@directus/data';
import type {
	AbstractSqlNestedMany,
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryWhereNode,
	ParameterTypes,
} from '../../index.js';
import type { FieldConversionResult } from './fields.js';
import { convertFilter } from '../modifiers/index.js';

/**
 * Converts a nested many node from the abstract query into a function which creates abstract SQL.
 * The generated function will be called later on, when the root query is executed and the result is available.
 *
 * @param fieldMeta - the relational meta data from the abstract query
 * @param nestedOutput - the result of the nested field conversion
 * @param idxGenerator - the generator used to increase the parameter indices
 * @param alias - the alias of the foreign collection
 * @returns A function to create a query with and information about the relation
 */
export function getNestedMany(
	field: AbstractQueryFieldNodeNestedMany,
	nestedOutput: FieldConversionResult,
	idxGenerator: Generator<number, number, number>
): AbstractSqlNestedMany {
	// it cannot be anything else than o2m at this point.
	const fieldMeta = field.meta as AbstractQueryFieldNodeRelationalOneToMany;

	const relationalConditions = fieldMeta.join.foreign.fields.map((f) =>
		getRelationCondition(fieldMeta.join.foreign.collection, f, idxGenerator)
	) as AtLeastOneElement<AbstractSqlQueryWhereNode>;

	const params: ParameterTypes[] = [];

	if (field.modifiers?.filter) {
		const conditions = convertFilter(field.modifiers.filter, fieldMeta.join.foreign.collection, idxGenerator);
		relationalConditions.push(conditions.clauses.where);
		params.push(...conditions.parameters);
	}

	let whereClause: AbstractSqlQueryWhereNode;

	if (relationalConditions.length > 1) {
		whereClause = {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: relationalConditions,
		};
	} else {
		whereClause = relationalConditions[0];
	}

	return {
		queryGenerator: (identifierValues) => ({
			clauses: {
				select: nestedOutput.clauses.select,
				from: fieldMeta.join.foreign.collection,
				where: whereClause,
			},
			parameters: [...nestedOutput.parameters, ...identifierValues, ...params],
			aliasMapping: nestedOutput.aliasMapping,
			nestedManys: nestedOutput.nestedManys,
		}),
		localJoinFields: fieldMeta.join.local.fields,
		foreignJoinFields: fieldMeta.join.foreign.fields,
		alias: fieldMeta.join.foreign.collection,
	};
}

/**
 * Create the condition to match the foreign key with the local key
 *
 * @param table
 * @param column
 * @param idxGenerator
 * @returns
 */
function getRelationCondition(
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
