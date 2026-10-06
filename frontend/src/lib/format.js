export const percentage = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const signed = new Intl.NumberFormat('pt-BR', { signDisplay: 'always', maximumFractionDigits: 2 });

export function compatible(before, after) {
  return before && after && before.scenario_id === after.scenario_id
    && before.scenario_version === after.scenario_version
    && before.evaluation_schema_version === after.evaluation_schema_version;
}
