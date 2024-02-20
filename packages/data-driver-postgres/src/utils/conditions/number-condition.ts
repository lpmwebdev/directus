import { convertNumericOperators, tableIndexToIdentifier, type SqlConditionNumberNode } from '@directus/data-sql';
import { applyFunction } from '../functions.js';
import { wrapColumn } from '../wrap-column.js';
import { applyJsonPathIfNeeded } from '../json-path.js';
import { applyIntegerCast } from '../casting.js';

export const numberCondition = (conditionNode: SqlConditionNumberNode, negate: boolean): string => {
	const target = conditionNode.target;
	let firstOperand;

	const tableAlias = tableIndexToIdentifier(target.tableIndex);

	if (target.type === 'fn') {
		firstOperand = applyFunction(target);
	} else {
		firstOperand = wrapColumn(tableAlias, target.columnName);
		firstOperand = applyJsonPathIfNeeded(conditionNode.target, firstOperand);

		if (target.type === 'json') {
			firstOperand = applyIntegerCast(firstOperand);
		}
	}

	const compareValue = `$${conditionNode.compareTo.parameterIndex + 1}`;
	const operation = convertNumericOperators(conditionNode.operation, negate);

	return `${firstOperand} ${operation} ${compareValue}`;
};
