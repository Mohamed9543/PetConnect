export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FiltersProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function Filters({ filters, values, onChange }: FiltersProps) {
  return (
    <>
      {filters.map((filter) => (
        <select
          key={filter.key}
          className="filter-select"
          value={values[filter.key] || ""}
          onChange={(e) => onChange(filter.key, e.target.value)}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </>
  );
}
